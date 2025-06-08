
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Phone, Mail, Clock, MessageCircle, Star, Heart, Search, MapPin, Facebook, Instagram, Twitter, Youtube, Info } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

const PublicStore = () => {
  const { products, storeConfig, loading: storeContextLoading } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!storeContextLoading) {
      const timer = setTimeout(() => setIsLoading(false), 300); // Small delay for smoother transition
      return () => clearTimeout(timer);
    } else {
      setIsLoading(true);
    }
  }, [storeContextLoading]);

  const categories = ['all', ...new Set(products.map(product => product.category).filter(Boolean))];
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.status !== 'sold';
  });

  const getStatusClass = (status) => {
    switch (status) {
      case 'available': return 'status-available';
      case 'out-of-stock': return 'status-out-of-stock';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'out-of-stock': return 'Agotado';
      default: return 'No Disponible';
    }
  };

  const handleWhatsAppContact = (phone, productName) => {
    if (!phone) {
      alert("Número de WhatsApp no configurado para este producto/tienda.");
      return;
    }
    const message = `¡Hola! Me interesa el producto: ${productName}. ¿Podrías darme más información?`;
    const url = `https://wa.me/${phone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };
  
  const SocialLink = ({ href, icon: Icon, label, colorClass }) => {
    if (!href) return null;
    // Ensure href has a protocol
    const fullHref = href.startsWith('http://') || href.startsWith('https://') ? href : `https://${href}`;
    return (
      <a href={fullHref} target="_blank" rel="noopener noreferrer" aria-label={label}
         className={`p-2 rounded-full hover:bg-white/20 transition-colors ${colorClass}`}>
        <Icon className="h-6 w-6" />
      </a>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-t-transparent border-white rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans">
      <section 
        className="hero-section text-white py-24 px-4 relative bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${storeConfig.banner_image_url || 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?auto=format&fit=crop&w=1600&q=80'})` }}
      >
        <div className="container mx-auto text-center relative z-10 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight">
              {storeConfig.name || 'Bienvenido a Nuestra Tienda'}
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-purple-100/90 max-w-2xl mx-auto">
              {storeConfig.slogan || 'Descubre productos increíbles.'}
            </p>
             {storeConfig.store_description && (
              <p className="text-md md:text-lg mb-10 text-purple-100/80 max-w-xl mx-auto">
                {storeConfig.store_description}
              </p>
            )}
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Button 
                size="lg" 
                className="bg-white text-purple-700 hover:bg-purple-100 shadow-lg transform hover:scale-105 transition-all duration-300 px-8 py-3 text-lg font-semibold rounded-lg"
                onClick={() => document.getElementById('products').scrollIntoView({ behavior: 'smooth' })}
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Ver Catálogo
              </Button>
              {storeConfig.whatsapp && (
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white text-white hover:bg-white hover:text-purple-700 shadow-lg transform hover:scale-105 transition-all duration-300 px-8 py-3 text-lg font-semibold rounded-lg"
                  onClick={() => handleWhatsAppContact(storeConfig.whatsapp, `consulta general sobre ${storeConfig.name}`)}
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Contactar Ahora
                </Button>
              )}
            </div>
          </motion.div>
        </div>
        
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="absolute top-20 left-10 animate-bounce-slow opacity-50 hidden md:block">
          <Star className="h-16 w-16 text-yellow-300/50" />
        </div>
        <div className="absolute bottom-20 right-20 animate-pulse-slow opacity-50 hidden md:block">
          <Heart className="h-12 w-12 text-pink-300/50" />
        </div>
      </section>

      <section className="py-12 px-4 bg-white sticky top-0 z-30 shadow-md">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex flex-col md:flex-row gap-4 mb-2 items-center">
              <div className="relative flex-1 w-full md:w-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Buscar productos por nombre, descripción o categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 text-base form-input w-full rounded-lg shadow-sm"
                />
              </div>
              {categories.length > 1 && (
                <div className="flex gap-2 flex-wrap justify-center md:justify-start">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      onClick={() => setSelectedCategory(category)}
                      className="capitalize rounded-md text-sm px-3 py-1.5 transition-colors duration-200"
                    >
                      {category === 'all' ? 'Todos' : category}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="products" className="py-16 px-4 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-800 mb-3">
              Nuestro Catálogo
            </h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Explora nuestra selección de productos de alta calidad.
            </p>
          </motion.div>

          {filteredProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Search className="h-20 w-20 text-gray-300 mx-auto mb-6" />
              <p className="text-2xl text-gray-700 font-semibold mb-2">No se encontraron productos</p>
              <p className="text-gray-500">Intenta ajustar tu búsqueda o filtro.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="h-full"
                >
                  <Card className="product-card overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out flex flex-col h-full rounded-xl border border-gray-200">
                    <div className="relative">
                      <img 
                        src={product.image_url || 'https://images.unsplash.com/photo-1580974928075-ba38599a8462?auto=format&fit=crop&w=600&q=60'} 
                        alt={product.name}
                        className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-md ${getStatusClass(product.status)}`}>
                        {getStatusText(product.status)}
                      </div>
                    </div>
                    <CardContent className="p-5 flex flex-col flex-grow">
                      <h3 className="text-xl font-semibold text-gray-800 mb-1 truncate" title={product.name}>
                        {product.name}
                      </h3>
                      <p className="text-sm text-purple-600 mb-3 font-medium">
                        {product.category}
                      </p>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow min-h-[60px]">
                        {product.description || "Descripción no disponible."}
                      </p>
                      <div className="flex items-center justify-between mb-4 mt-auto">
                        <span className="text-2xl font-bold text-green-600">
                          ${typeof product.price === 'number' ? product.price.toFixed(2) : 'N/A'}
                        </span>
                      </div>
                      {product.status === 'available' && (product.whatsapp || storeConfig.whatsapp) && (
                        <Button
                          className="w-full whatsapp-btn text-white font-semibold py-2.5 rounded-md"
                          onClick={() => handleWhatsAppContact(product.whatsapp || storeConfig.whatsapp, product.name)}
                        >
                          <MessageCircle className="mr-2 h-5 w-5" />
                          Consultar por WhatsApp
                        </Button>
                      )}
                      {product.status === 'out-of-stock' && (
                         <Button
                          className="w-full bg-yellow-500 text-white font-semibold py-2.5 rounded-md cursor-not-allowed"
                          disabled
                        >
                          Agotado Temporalmente
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-r from-purple-700 to-blue-700 text-white">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">¿Tienes Preguntas?</h2>
            <p className="text-xl text-purple-100/90 max-w-2xl mx-auto">
              Estamos aquí para ayudarte. Contáctanos a través de cualquiera de estos medios.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { icon: Phone, title: "Llámanos", value: storeConfig.phone, href: `tel:${storeConfig.phone}` , color: "green"},
              { icon: Mail, title: "Escríbenos", value: storeConfig.email, href: `mailto:${storeConfig.email}`, color: "blue" },
              { icon: MessageCircle, title: "WhatsApp", value: storeConfig.whatsapp, action: () => handleWhatsAppContact(storeConfig.whatsapp, `consulta general sobre ${storeConfig.name}`), color: "teal" }
            ].map((item, index) => (
              item.value ? (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center glass-effect rounded-xl p-8 shadow-xl hover:shadow-2xl transition-shadow"
              >
                <item.icon className={`h-12 w-12 mx-auto mb-5 text-${item.color}-300`} />
                <h3 className="text-2xl font-semibold mb-2">{item.title}</h3>
                {item.action ? (
                  <Button variant="link" className="text-lg text-white hover:text-purple-200 p-0" onClick={item.action}>
                    {item.value}
                  </Button>
                ) : (
                  <a href={item.href} className="text-lg text-purple-100 hover:text-white transition-colors">{item.value}</a>
                )}
              </motion.div>
              ) : null
            ))}
          </div>
          
          {storeConfig.schedule && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center mt-16 glass-effect rounded-xl p-8 max-w-md mx-auto shadow-xl"
            >
              <Clock className="h-12 w-12 mx-auto mb-5 text-yellow-300" />
              <h3 className="text-2xl font-semibold mb-2">Horarios de Atención</h3>
              <p className="text-lg text-purple-100/90 whitespace-pre-line">{storeConfig.schedule}</p>
            </motion.div>
          )}

        </div>
      </section>

      <footer className="bg-slate-900 text-gray-300 py-12 px-4">
        <div className="container mx-auto text-center">
          <img  src="/vite.svg" alt="Logo de la tienda" className="h-12 w-auto mx-auto mb-4 filter grayscale brightness-200" src="https://images.unsplash.com/photo-1485531865381-286666aa80a9" />
          <p className="text-lg font-semibold text-white mb-2">
            {storeConfig.name || 'Mi Tienda'}
          </p>
          <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
            {storeConfig.store_description || storeConfig.slogan || 'Gracias por visitarnos.'}
          </p>
          <div className="flex justify-center space-x-6 mb-8">
            <SocialLink href={storeConfig.facebook} icon={Facebook} label="Facebook" colorClass="text-blue-400 hover:text-blue-300"/>
            <SocialLink href={storeConfig.instagram} icon={Instagram} label="Instagram" colorClass="text-pink-400 hover:text-pink-300"/>
            <SocialLink href={storeConfig.twitter} icon={Twitter} label="Twitter/X" colorClass="text-sky-400 hover:text-sky-300"/>
            <SocialLink href={storeConfig.tiktok} icon={Youtube} label="TikTok" colorClass="text-red-400 hover:text-red-300"/>
          </div>
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} {storeConfig.name || 'Mi Tienda'}. Todos los derechos reservados.
          </p>
           <p className="text-xs text-gray-600 mt-1">
            Diseñado con ❤️ por Hostinger Horizons
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicStore;
