
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, X } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Shadcn Select
import { toast } from '@/components/ui/use-toast';

const ProductForm = ({ product, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    status: 'available',
    whatsapp: '',
    image: null, 
    image_url: '' 
  });
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const { addProduct, updateProduct, storeConfig } = useStore(); // Added storeConfig
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category: product.category || '',
        description: product.description || '',
        price: product.price || '',
        status: product.status || 'available',
        whatsapp: product.whatsapp || '',
        image: null, 
        image_url: product.image_url || ''
      });
      setImagePreview(product.image_url || '');
    } else {
      setFormData({
        name: '',
        category: '',
        description: '',
        price: '',
        status: 'available',
        whatsapp: storeConfig?.whatsapp || '', // Default to store's WhatsApp
        image: null,
        image_url: ''
      });
      setImagePreview('');
    }
  }, [product, storeConfig]); // Added storeConfig dependency

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStatusChange = (value) => {
    setFormData(prev => ({ ...prev, status: value }));
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
        toast({
          title: "Error",
          description: "La imagen no puede ser mayor a 5MB",
          variant: "destructive",
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; 
        }
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
      setFormData(prev => ({
        ...prev,
        image: file 
      }));
    }
  };

  const removeImage = () => {
    setImagePreview('');
    setFormData(prev => ({
      ...prev,
      image: null, 
      image_url: product ? prev.image_url : '' 
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; 
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.name.trim()) throw new Error('El nombre del producto es requerido');
      if (!formData.category.trim()) throw new Error('La categoría es requerida');
      if (!formData.price || parseFloat(formData.price) <= 0) throw new Error('El precio debe ser mayor a 0');
      if (formData.whatsapp && formData.whatsapp.trim() && !/^\+?[1-9]\d{1,14}$/.test(formData.whatsapp.replace(/\s+/g, ''))) {
         throw new Error('El número de WhatsApp debe estar en formato internacional (ej: +1234567890 o 1234567890)');
      }
      
      const productPayload = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        price: parseFloat(formData.price),
        status: formData.status,
        whatsapp: formData.whatsapp || storeConfig?.whatsapp || '', // Fallback to store WhatsApp
        image_url: formData.image_url, 
      };
      
      if (formData.image) { 
          productPayload.image = formData.image;
      }


      if (product && product.id) { 
        await updateProduct(product.id, productPayload);
      } else {
        await addProduct(productPayload);
      }

      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al guardar el producto.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del Producto *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Ej: iPhone 15 Pro"
            className="form-input"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoría *</Label>
          <Input
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            placeholder="Ej: Electrónicos"
            className="form-input"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleInputChange}
          placeholder="Describe las características principales del producto..."
          className="form-input min-h-[100px]"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="price">Precio *</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={handleInputChange}
            placeholder="0.00"
            className="form-input"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Select value={formData.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="form-input">
              <SelectValue placeholder="Selecciona un estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Disponible</SelectItem>
              <SelectItem value="out-of-stock">Agotado</SelectItem>
              <SelectItem value="sold">Vendido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatsapp">WhatsApp de Contacto (Opcional, si es diferente al de la tienda)</Label>
        <Input
          id="whatsapp"
          name="whatsapp"
          value={formData.whatsapp}
          onChange={handleInputChange}
          placeholder={storeConfig?.whatsapp || "+1234567890 (incluir código de país)"}
          className="form-input"
        />
      </div>

      <div className="space-y-2">
        <Label>Imagen del Producto</Label>
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 transition-colors"
          onClick={triggerFileInput}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleImageFileChange({ target: { files: e.dataTransfer.files } });
            }
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          {imagePreview ? (
            <div className="relative">
              <img 
                src={imagePreview}
                alt="Preview"
                className="max-w-full h-48 object-cover mx-auto rounded-lg"
               src="https://images.unsplash.com/photo-1627577741153-74b82d87607b" />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 z-10"
                onClick={(e) => {
                  e.stopPropagation(); 
                  removeImage();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div>
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Arrastra una imagen aquí o haz clic para seleccionar</p>
              <p className="text-sm text-gray-500">PNG, JPG hasta 5MB</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            id="image-upload" 
            name="image-upload"
            accept="image/*"
            onChange={handleImageFileChange}
            className="hidden" 
          />
        </div>
      </div>

      <div className="flex space-x-4 pt-6">
        <Button
          type="submit"
          className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
          disabled={loading}
        >
          {loading ? 'Guardando...' : (product && product.id ? 'Actualizar Producto' : 'Agregar Producto')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
      </div>
    </motion.form>
  );
};

export default ProductForm;
