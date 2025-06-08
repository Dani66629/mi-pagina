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
  slogan: 'Configura tu tienda',
  banner_image_url: '',
  store_description: '',
  email: '',
  phone: '',
  whatsapp: '',
  facebook: '',
  instagram: '',
  twitter: '',
  tiktok: '',
  schedule: '',
  created_at: null, 
  updated_at: null,
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
      .limit(1)
      .maybeSingle(); // Use maybeSingle() to allow 0 or 1 row without error

    if (error) {
      console.error('Error fetching store config:', error);
      toast({ title: "Error", description: "No se pudo cargar la configuración de la tienda.", variant: "destructive" });
      setStoreConfig(initialStoreConfigFallback);
    } else if (data) {
      setStoreConfig(data);
    } else {
      // No config found, this is normal for the first setup.
      console.warn('No store config found. Please set up store configuration in admin panel.');
      setStoreConfig(initialStoreConfigFallback); // Ensures id is null
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
    let imageUrl = productData.image_url || '';

    if (!storeConfig || !storeConfig.id) {
      toast({ title: "Configuración Requerida", description: "Primero debes guardar la configuración de la tienda antes de agregar productos.", variant: "destructive" });
      return;
    }

    if (image instanceof File) {
      const fileExt = image.name.split('.').pop();
      const fileName = `product_${Date.now()}.${fileExt}`;
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
    } else if (typeof image === 'string' && image.startsWith('data:image')) {
       const response = await fetch(image);
       const blob = await response.blob();
       const fileExt = blob.type.split('/')[1] || 'png';
       const fileName = `product_${Date.now()}.${fileExt}`;
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

    const productToInsert = { 
      ...restOfProductData, 
      image_url: imageUrl, 
      store_config_id: storeConfig.id 
    };

    const { data, error } = await supabase
      .from('products')
      .insert([productToInsert])
      .select()
      .single();

    if (error) {
      console.error('Error adding product:', error);
      toast({ title: "Error", description: `No se pudo agregar el producto: ${error.message}`, variant: "destructive" });
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
      const fileName = `product_${Date.now()}.${fileExt}`;
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

      const oldProduct = products.find(p => p.id === id);
      if (oldProduct && oldProduct.image_url && oldProduct.image_url !== imageUrl) {
        const oldImageName = oldProduct.image_url.split('/').pop();
        if (oldImageName) {
            await supabase.storage.from('product-images').remove([`public/${oldImageName}`]);
        }
      }
    } else if (typeof image === 'string' && image.startsWith('data:image') && image !== productData.image_url) {
       const response = await fetch(image);
       const blob = await response.blob();
       const fileExt = blob.type.split('/')[1] || 'png';
       const fileName = `product_${Date.now()}.${fileExt}`;
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
      if (oldProduct && oldProduct.image_url && oldProduct.image_url !== imageUrl) {
        const oldImageName = oldProduct.image_url.split('/').pop();
         if (oldImageName) {
            await supabase.storage.from('product-images').remove([`public/${oldImageName}`]);
        }
      }
    }

    const productToUpdate = { 
      ...restOfProductData, 
      image_url: imageUrl, 
      updated_at: new Date().toISOString() 
    };

    const { data, error } = await supabase
      .from('products')
      .update(productToUpdate)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating product:', error);
      toast({ title: "Error", description: `No se pudo actualizar el producto: ${error.message}`, variant: "destructive" });
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
      toast({ title: "Error", description: `No se pudo eliminar el producto: ${error.message}`, variant: "destructive" });
    } else {
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
            .from('product-images')
            .upload(filePath, bannerImage);

        if (uploadError) {
            console.error('Error uploading banner image:', uploadError);
            toast({ title: "Error de Carga", description: uploadError.message, variant: "destructive" });
            return;
        }
        const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
        bannerImageUrl = publicUrlData.publicUrl;
        
        if (storeConfig && storeConfig.id && storeConfig.banner_image_url && storeConfig.banner_image_url !== bannerImageUrl) {
            const oldImageName = storeConfig.banner_image_url.split('/').pop();
             if (oldImageName) {
                await supabase.storage.from('product-images').remove([`public/${oldImageName}`]);
            }
        }

    } else if (typeof bannerImage === 'string' && bannerImage.startsWith('data:image') && bannerImage !== configData.banner_image_url) {
       const response = await fetch(bannerImage);
       const blob = await response.blob();
       const fileExt = blob.type.split('/')[1] || 'png';
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

       if (storeConfig && storeConfig.id && storeConfig.banner_image_url && storeConfig.banner_image_url !== bannerImageUrl) {
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
    
    const currentConfigId = storeConfig?.id; // Capture current ID before potential modification

    if (!currentConfigId) { // If inserting, remove fields that DB should auto-generate or that are not part of the payload
      delete configToSave.id; 
      delete configToSave.created_at; 
    } else { // If updating, ensure ID is part of the payload for clarity, even if not strictly needed by Supabase update
      configToSave.id = currentConfigId;
    }
    

    let response;
    if (currentConfigId) {
        response = await supabase
            .from('store_config')
            .update(configToSave)
            .eq('id', currentConfigId)
            .select()
            .single();
    } else {
        response = await supabase
            .from('store_config')
            .insert(configToSave)
            .select()
            .single();
    }
    
    const { data, error } = response;

    if (error) {
      console.error('Error updating store config:', error);
      toast({ title: "Error", description: `No se pudo guardar la configuración: ${error.message}`, variant: "destructive" });
    } else if(data) {
      setStoreConfig(data); // This will now have an ID if it was an insert
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
    loadingConfig, // expose individual loading states
    loadingProducts,
    loading: loadingConfig || loadingProducts, // keep combined loading for general use
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