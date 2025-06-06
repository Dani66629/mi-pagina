import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, Eye, MessageCircle, Image as ImageIcon } from 'lucide-react'; // ImageIcon importado
import { supabase } from '@/lib/supabaseClient';
import { useStore } from '@/contexts/StoreContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

const ProductList = ({ products, onEdit, compact = false }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { deleteProduct } = useStore();

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'sold': return 'bg-red-100 text-red-800';
      case 'out-of-stock': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'sold': return 'Vendido';
      case 'out-of-stock': return 'Agotado';
      default: return 'Desconocido';
    }
  };

  const handleDelete = async (product) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar "${product.name}"?`)) {
      try {
        await deleteProduct(product.id, product.image_url);
        toast({
          title: "Producto eliminado",
          description: "El producto se ha eliminado correctamente",
        });
      } catch (error) {
        toast({
          title: "Error al eliminar",
          description: error.message || "No se pudo eliminar el producto.",
          variant: "destructive",
        });
      }
    }
  };

  const handleWhatsAppContact = (phone, productName) => {
    if (!phone) {
      toast({
        title: "WhatsApp no disponible",
        description: "Este producto no tiene un número de WhatsApp configurado.",
        variant: "destructive",
      });
      return;
    }
    const message = `¡Hola! Me interesa el producto: ${productName}.`;
    const url = `https://wa.me/${phone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No hay productos agregados aún.</p>
        <p className="text-gray-400">Agrega tu primer producto para comenzar.</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-10 h-10 object-cover rounded-md"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <div>
                <h3 className="font-medium text-sm text-gray-800">{product.name}</h3>
                <p className="text-xs text-gray-500">${product.price}</p>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
              {getStatusText(product.status)}
            </span>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="h-full flex"
        >
          <Card className="product-card admin-card overflow-hidden h-full w-full flex flex-col">
            <div className="relative">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(product.status)}`}>
                {getStatusText(product.status)}
              </div>
            </div>
            
            <CardContent className="p-4 flex flex-col flex-grow">
              <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-1" title={product.name}>
                {product.name}
              </h3>
              <p className="text-sm text-purple-600 mb-2 font-medium">
                {product.category}
              </p>
              <p className="text-gray-600 mb-3 line-clamp-2 text-sm flex-grow min-h-[40px]">
                {product.description || "Sin descripción."}
              </p>
              <div className="flex items-center justify-between mb-4 mt-auto">
                <span className="text-xl font-bold text-green-600">
                  ${product.price}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <Eye className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Ver</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{selectedProduct?.name}</DialogTitle>
                    </DialogHeader>
                    {selectedProduct && (
                      <div className="space-y-4 pt-4">
                        {selectedProduct.image_url && (
                          <img
                            src={selectedProduct.image_url}
                            alt={selectedProduct.name}
                            className="w-full h-64 object-contain rounded-lg bg-gray-100"
                          />
                        )}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div>
                            <p className="font-semibold text-gray-500">Categoría:</p>
                            <p className="text-gray-800">{selectedProduct.category}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-500">Precio:</p>
                            <p className="text-green-600 font-bold">${selectedProduct.price}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-500">Estado:</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedProduct.status)}`}>
                              {getStatusText(selectedProduct.status)}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-500">WhatsApp:</p>
                            <p className="text-gray-800">{selectedProduct.whatsapp}</p>
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500">Descripción:</p>
                          <p className="text-gray-700 whitespace-pre-wrap">{selectedProduct.description || "Sin descripción detallada."}</p>
                        </div>
                        <div className="flex pt-4">
                          {selectedProduct.status === 'available' && (
                            <Button
                              className="w-full whatsapp-btn text-white"
                              onClick={() => handleWhatsAppContact(selectedProduct.whatsapp, selectedProduct.name)}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Contactar por WhatsApp
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onEdit(product)}
                >
                  <Edit className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Editar</span>
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => handleDelete(product)}
                >
                  <Trash2 className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Borrar</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default ProductList;