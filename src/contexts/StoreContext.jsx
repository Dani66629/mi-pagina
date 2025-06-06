import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

const StoreContext = createContext();

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore debe ser usado dentro de StoreProvider');
  }
  return context;
};

const initialStoreConfigFallback = {
  id: null,
  name: 'Tu Tienda Online',
  slogan: 'Cargando configuración...',
  banner_image_url: '',
  store_description: '',
  email: '',
  phone: '',
  whatsapp: '',
  facebook: '',
  instagram: '',
  twitter: '',
  tiktok: '',
  schedule: ''
};

export const StoreProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [storeConfig, setStoreConfig] = useState(initialStoreConfigFallback);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const fetchStoreConfig = useCallback(async () => {
    setLoadingConfig(true);
    const { data, error } = await supabase
      .from('store_config')
      .select('*')
      .limit(1) // Assuming one config row
      .single(); 

    if (error) {
      console.error('Error fetching store config:', error);
      toast({ title: "Error", description: "No se pudo cargar la configuración de la tienda.", variant: "destructive" });
      setStoreConfig(initialStoreConfigFallback); // Fallback on error
    } else if (data) {
      setStoreConfig(data);
    } else {
      // No config found, insert a default one if this is the first run for an admin.
      // This part is tricky because anonymous users might trigger this.
      // Best to ensure an admin creates the first config row through the UI or a seed script.
      console.warn('No store config found. Please set up store configuration in admin panel.');
      setStoreConfig(initialStoreConfigFallback); // Fallback
    }
    setLoadingConfig(false);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      toast({ title: "Error", description: "No se pudieron cargar los productos.", variant: "destructive" });
      setProducts([]);
    } else {
      setProducts(data || []);
    }
    setLoadingProducts(false);
  }, []);

  useEffect(() => {
    fetchStoreConfig();
    fetchProducts();
  }, [fetchStoreConfig, fetchProducts]);
  
  const addProduct = async (productData) => {
    const { image, ...restOfProductData } = productData;
    let imageUrl = productData.image_url || ''; // Keep existing URL if not changing image

    if (image instanceof File) { // Check if 'image' is a File object for new uploads
      const fileExt = image.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, image);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        toast({ title: "Error de Carga", description: uploadError.message, variant: "destructive" });
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
      imageUrl = publicUrlData.publicUrl;
    } else if (typeof image === 'string' && image.startsWith('data:image')) { // Handle base64 new uploads
       const response = await fetch(image);
       const blob = await response.blob();
       const fileExt = blob.type.split('/')[1];
       const fileName = `${Date.now()}.${fileExt}`;
       const filePath = `public/${fileName}`;
       
       const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, blob);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        toast({ title: "Error de Carga", description: uploadError.message, variant: "destructive" });
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
      imageUrl = publicUrlData.publicUrl;
    }


    const { data, error } = await supabase
      .from('products')
      .insert([{ ...restOfProductData, image_url: imageUrl, store_config_id: storeConfig.id }])
      .select()
      .single();

    if (error) {
      console.error('Error adding product:', error);
      toast({ title: "Error", description: "No se pudo agregar el producto.", variant: "destructive" });
    } else if (data) {
      setProducts(prev => [data, ...prev]);
      toast({ title: "¡Éxito!", description: "Producto agregado correctamente." });
    }
  };

  const updateProduct = async (id, productData) => {
    const { image, ...restOfProductData } = productData;
    let imageUrl = productData.image_url; 
    
    if (image instanceof File) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, image);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        toast({ title: "Error de Carga", description: uploadError.message, variant: "destructive" });
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
      imageUrl = publicUrlData.publicUrl;

      // Optionally delete old image if a new one is uploaded and an old one existed
      const oldProduct = products.find(p => p.id === id);
      if (oldProduct && oldProduct.image_url) {
        const oldImageName = oldProduct.image_url.split('/').pop();
        if (oldImageName) {
            await supabase.storage.from('product-images').remove([`public/${oldImageName}`]);
        }
      }
    } else if (typeof image === 'string' && image.startsWith('data:image') && image !== productData.image_url) { // Handle base64 updates
       const response = await fetch(image);
       const blob = await response.blob();
       const fileExt = blob.type.split('/')[1];
       const fileName = `${Date.now()}.${fileExt}`;
       const filePath = `public/${fileName}`;
       
       const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, blob);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        toast({ title: "Error de Carga", description: uploadError.message, variant: "destructive" });
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
      imageUrl = publicUrlData.publicUrl;

      const oldProduct = products.find(p => p.id === id);
      if (oldProduct && oldProduct.image_url) {
        const oldImageName = oldProduct.image_url.split('/').pop();
         if (oldImageName) {
            await supabase.storage.from('product-images').remove([`public/${oldImageName}`]);
        }
      }
    }


    const { data, error } = await supabase
      .from('products')
      .update({ ...restOfProductData, image_url: imageUrl, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating product:', error);
      toast({ title: "Error", description: "No se pudo actualizar el producto.", variant: "destructive" });
    } else if (data) {
      setProducts(prev => prev.map(p => (p.id === id ? data : p)));
      toast({ title: "¡Éxito!", description: "Producto actualizado correctamente." });
    }
  };

  const deleteProduct = async (id) => {
    const productToDelete = products.find(p => p.id === id);

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      toast({ title: "Error", description: "No se pudo eliminar el producto.", variant: "destructive" });
    } else {
      // Delete image from storage
      if (productToDelete && productToDelete.image_url) {
        const imageName = productToDelete.image_url.split('/').pop();
        if (imageName) {
            const { error: storageError } = await supabase.storage.from('product-images').remove([`public/${imageName}`]);
            if (storageError) console.error("Error deleting image from storage:", storageError);
        }
      }
      setProducts(prev => prev.filter(p => p.id !== id));
      toast({ title: "¡Éxito!", description: "Producto eliminado correctamente." });
    }
  };

  const updateStoreConfig = async (configData) => {
    const { bannerImage, ...restOfConfigData } = configData;
    let bannerImageUrl = configData.banner_image_url;

    if (bannerImage instanceof File) {
        const fileExt = bannerImage.name.split('.').pop();
        const fileName = `banner_${Date.now()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('product-images') // Using the same bucket for convenience
            .upload(filePath, bannerImage);

        if (uploadError) {
            console.error('Error uploading banner image:', uploadError);
            toast({ title: "Error de Carga", description: uploadError.message, variant: "destructive" });
            return;
        }
        const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
        bannerImageUrl = publicUrlData.publicUrl;
        
        if (storeConfig.banner_image_url) {
            const oldImageName = storeConfig.banner_image_url.split('/').pop();
             if (oldImageName) {
                await supabase.storage.from('product-images').remove([`public/${oldImageName}`]);
            }
        }

    } else if (typeof bannerImage === 'string' && bannerImage.startsWith('data:image') && bannerImage !== configData.banner_image_url) {
       const response = await fetch(bannerImage);
       const blob = await response.blob();
       const fileExt = blob.type.split('/')[1];
       const fileName = `banner_${Date.now()}.${fileExt}`;
       const filePath = `public/${fileName}`;
       
       const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, blob);

      if (uploadError) {
        console.error('Error uploading banner image:', uploadError);
        toast({ title: "Error de Carga", description: uploadError.message, variant: "destructive" });
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
      bannerImageUrl = publicUrlData.publicUrl;

       if (storeConfig.banner_image_url) {
            const oldImageName = storeConfig.banner_image_url.split('/').pop();
             if (oldImageName) {
                await supabase.storage.from('product-images').remove([`public/${oldImageName}`]);
            }
        }
    }


    const configToSave = {
        ...restOfConfigData,
        banner_image_url: bannerImageUrl,
        updated_at: new Date().toISOString()
    };
    
    // Ensure ID is present for update, or handle insert if it's the first time
    let response;
    if (storeConfig && storeConfig.id) {
        response = await supabase
            .from('store_config')
            .update(configToSave)
            .eq('id', storeConfig.id)
            .select()
            .single();
    } else {
        // This case should ideally be handled by an initial setup by an admin
        // For now, we'll try to insert if no ID exists (might fail based on RLS if not admin)
        response = await supabase
            .from('store_config')
            .insert(configToSave)
            .select()
            .single();
    }
    
    const { data, error } = response;

    if (error) {
      console.error('Error updating store config:', error);
      toast({ title: "Error", description: "No se pudo guardar la configuración.", variant: "destructive" });
    } else if(data) {
      setStoreConfig(data);
      toast({ title: "¡Éxito!", description: "Configuración guardada correctamente." });
    }
  };


  const value = {
    products,
    storeConfig,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStoreConfig,
    loading: loadingConfig || loadingProducts,
    refetchData: () => {
      fetchStoreConfig();
      fetchProducts();
    }
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};
