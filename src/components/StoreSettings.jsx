import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, Upload, X, Settings2, UserCircle, Globe, Palette } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

const StoreSettings = () => {
  const { storeConfig, updateStoreConfig, loading: storeLoading } = useStore();
  const [formData, setFormData] = useState(storeConfig);
  const [formLoading, setFormLoading] = useState(false); // Separate loading state for form submission
  const [bannerPreview, setBannerPreview] = useState('');
  const bannerFileInputRef = useRef(null);

  useEffect(() => {
    if (storeConfig && storeConfig.id) { // Check if storeConfig has loaded
        setFormData({
          ...storeConfig,
          bannerImage: null, // For new file input
          banner_image_url: storeConfig.banner_image_url || '' // Existing URL
        });
        setBannerPreview(storeConfig.banner_image_url || '');
    }
  }, [storeConfig]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBannerFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "La imagen no puede ser mayor a 5MB",
          variant: "destructive",
        });
        if (bannerFileInputRef.current) {
          bannerFileInputRef.current.value = ''; 
        }
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setBannerPreview(event.target.result);
      };
      reader.readAsDataURL(file);
      setFormData(prev => ({
        ...prev,
        bannerImage: file // Store the File object
      }));
    }
  };

  const removeBanner = () => {
    setBannerPreview('');
    setFormData(prev => ({
      ...prev,
      bannerImage: null, // Clear File object
      banner_image_url: storeConfig ? prev.banner_image_url : ''
    }));
    if (bannerFileInputRef.current) {
      bannerFileInputRef.current.value = '';
    }
  };
  
  const triggerBannerFileInput = () => {
    if (bannerFileInputRef.current) {
      bannerFileInputRef.current.click();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (!formData.name || !formData.name.trim()) throw new Error('El nombre de la tienda es requerido');
      if (!formData.email || !formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) throw new Error('El email no es válido');
      if (!formData.phone || !formData.phone.trim()) throw new Error('El teléfono es requerido');
      if (formData.whatsapp && formData.whatsapp.trim() && !/^\+[1-9]\d{1,14}$/.test(formData.whatsapp.replace(/\s+/g, ''))) {
         throw new Error('El número de WhatsApp debe estar en formato internacional (ej: +1234567890)');
      }

      const configPayload = { ...formData };
      // bannerImage (File object) will be handled by updateStoreConfig
      // banner_image_url is already part of formData
      
      await updateStoreConfig(configPayload);
      
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al guardar la configuración.",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const SectionCard = ({ title, icon, children }) => {
    const IconComponent = icon;
    return (
      <motion.div 
        className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center text-xl font-semibold text-gray-700 mb-4">
          <IconComponent className="w-6 h-6 mr-3 text-purple-600" />
          {title}
        </div>
        <div className="space-y-4">
          {children}
        </div>
      </motion.div>
    );
  };

  if (storeLoading && !storeConfig.id) { // Show loading state if initial config isn't loaded yet
    return <p>Cargando configuración de la tienda...</p>;
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      <SectionCard title="Información General de la Tienda" icon={Settings2}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Tienda *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleInputChange}
              placeholder="Mi Tienda Online"
              className="form-input"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slogan">Slogan o Mensaje Principal</Label>
            <Input
              id="slogan"
              name="slogan"
              value={formData.slogan || ''}
              onChange={handleInputChange}
              placeholder="Los mejores productos al mejor precio"
              className="form-input"
            />
          </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="store_description">Descripción Corta de la Tienda</Label>
            <Textarea
                id="store_description"
                name="store_description"
                value={formData.store_description || ''}
                onChange={handleInputChange}
                placeholder="Una breve descripción de tu tienda, qué ofreces, etc."
                className="form-input min-h-[80px]"
                rows={3}
            />
        </div>
      </SectionCard>
      
      <SectionCard title="Apariencia y Portada" icon={Palette}>
        <div className="space-y-2">
            <Label>Banner de Portada</Label>
            <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 transition-colors"
                onClick={triggerBannerFileInput}
                onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleBannerFileChange({ target: { files: e.dataTransfer.files } });
                    }
                }}
                onDragOver={(e) => e.preventDefault()}
            >
            {bannerPreview ? (
                <div className="relative">
                <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="max-w-full h-32 object-cover mx-auto rounded-lg"
                />
                <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 z-10"
                    onClick={(e) => {
                        e.stopPropagation();
                        removeBanner();
                    }}
                >
                    <X className="h-4 w-4" />
                </Button>
                </div>
            ) : (
                <div>
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Arrastra un banner aquí o haz clic para seleccionar</p>
                <p className="text-sm text-gray-500">PNG, JPG hasta 5MB</p>
                </div>
            )}
            <input
                ref={bannerFileInputRef}
                type="file"
                id="banner-upload"
                name="banner-upload"
                accept="image/*"
                onChange={handleBannerFileChange}
                className="hidden"
            />
            </div>
        </div>
      </SectionCard>

      <SectionCard title="Datos de Contacto y Vendedor" icon={UserCircle}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email de Contacto *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email || ''}
              onChange={handleInputChange}
              placeholder="contacto@mitienda.com"
              className="form-input"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono *</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone || ''}
              onChange={handleInputChange}
              placeholder="+1234567890"
              className="form-input"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                id="whatsapp"
                name="whatsapp"
                value={formData.whatsapp || ''}
                onChange={handleInputChange}
                placeholder="+1234567890 (incluir código de país)"
                className="form-input"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="schedule">Horarios de Atención</Label>
                <Input
                id="schedule"
                name="schedule"
                value={formData.schedule || ''}
                onChange={handleInputChange}
                placeholder="Lunes a Viernes: 9:00 AM - 6:00 PM"
                className="form-input"
                />
            </div>
        </div>
      </SectionCard>

      <SectionCard title="Redes Sociales" icon={Globe}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="facebook">Facebook URL</Label>
            <Input
              id="facebook"
              name="facebook"
              value={formData.facebook || ''}
              onChange={handleInputChange}
              placeholder="https://facebook.com/mitienda"
              className="form-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram URL</Label>
            <Input
              id="instagram"
              name="instagram"
              value={formData.instagram || ''}
              onChange={handleInputChange}
              placeholder="https://instagram.com/mitienda"
              className="form-input"
            />
          </div>
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="twitter">Twitter/X URL</Label>
            <Input
              id="twitter"
              name="twitter"
              value={formData.twitter || ''}
              onChange={handleInputChange}
              placeholder="https://x.com/mitienda"
              className="form-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tiktok">TikTok URL</Label>
            <Input
              id="tiktok"
              name="tiktok"
              value={formData.tiktok || ''}
              onChange={handleInputChange}
              placeholder="https://tiktok.com/@mitienda"
              className="form-input"
            />
          </div>
        </div>
      </SectionCard>


      <div className="pt-6">
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          disabled={formLoading || storeLoading}
        >
          <Save className="mr-2 h-5 w-5" />
          {formLoading ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>
    </motion.form>
  );
};

export default StoreSettings;