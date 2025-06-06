
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard,
  Package, 
  Settings, 
  LogOut, 
  PlusCircle, 
  Eye,
  ShoppingBag,
  DollarSign,
  Users as UsersIcon // Renamed to avoid conflict with Users component
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ProductForm from '@/components/ProductForm';
import StoreSettings from '@/components/StoreSettings';
import ProductList from '@/components/ProductList';
import { toast } from '@/components/ui/use-toast';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [editingProduct, setEditingProduct] = useState(null);
  const { isAuthenticated, logout, user, loading: authLoading } = useAuth();
  const { products, storeConfig, loading: storeLoading, refetchData } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin');
    }
    // Refetch data when dashboard loads or user changes, to ensure freshness
    if (isAuthenticated) {
        refetchData();
    }
  }, [isAuthenticated, authLoading, navigate, refetchData, user]);

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    });
    navigate('/admin');
  };

  const stats = {
    totalProducts: products?.length || 0,
    availableProducts: products?.filter(p => p.status === 'available').length || 0,
    soldProducts: products?.filter(p => p.status === 'sold').length || 0,
    totalValue: products?.reduce((sum, p) => sum + (p.status === 'available' ? parseFloat(p.price) : 0), 0) || 0
  };

  const menuItems = [
    { id: 'overview', label: 'Resumen', icon: LayoutDashboard, description: 'Vista general de tu tienda y estadísticas.' },
    { id: 'products', label: 'Productos', icon: Package, description: 'Gestiona tu inventario de productos.' },
    { id: 'add-product', label: 'Agregar Producto', icon: PlusCircle, description: 'Añade nuevos artículos a tu catálogo.' },
    { id: 'settings', label: 'Configuración Tienda', icon: Settings, description: 'Personaliza los detalles de tu tienda.' },
  ];

  const renderContent = () => {
    if (storeLoading && activeTab !== 'overview' && activeTab !== 'settings') { // Allow overview and settings to load some UI even if data is fetching
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-xl text-gray-500">Cargando datos...</p>
            </div>
        );
    }
    const currentMenuItem = menuItems.find(item => item.id === activeTab);
    return (
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="pb-6 border-b border-gray-200"
        >
          <h2 className="text-4xl font-bold text-gray-800 flex items-center">
            {currentMenuItem?.icon && <currentMenuItem.icon className="w-8 h-8 mr-3 text-purple-600" />}
            {currentMenuItem?.label}
          </h2>
          <p className="text-gray-600 mt-2 ml-11">{currentMenuItem?.description}</p>
        </motion.div>
        
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Total Productos', value: stats.totalProducts, icon: Package, color: 'purple', subtext: 'artículos en inventario' },
                { title: 'Disponibles', value: stats.availableProducts, icon: ShoppingBag, color: 'green', subtext: 'listos para vender' },
                { title: 'Vendidos', value: stats.soldProducts, icon: UsersIcon, color: 'blue', subtext: 'productos entregados' },
                { title: 'Valor Inventario', value: `$${stats.totalValue.toFixed(2)}`, icon: DollarSign, color: 'yellow', subtext: 'de productos disponibles' },
              ].map((stat, idx) => (
                <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                  <Card className="admin-card shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                      <stat.icon className={`h-5 w-5 text-${stat.color}-500`} />
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold text-${stat.color}-600`}>{stat.value}</div>
                      <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            <Card className="admin-card shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Productos Recientes</CardTitle>
                <CardDescription>Los últimos 5 productos agregados o modificados.</CardDescription>
              </CardHeader>
              <CardContent>
                <ProductList 
                  products={products?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5) || []} 
                  onEdit={(product) => {
                    setEditingProduct(product);
                    setActiveTab('add-product');
                  }}
                  compact={true}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'products' && (
          <Card className="admin-card shadow-lg">
            <CardHeader>
               <CardTitle className="text-xl">Gestión de Productos</CardTitle>
               <CardDescription>Edita, elimina o visualiza los detalles de tus productos.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductList 
                products={products || []} 
                onEdit={(product) => {
                  setEditingProduct(product);
                  setActiveTab('add-product');
                }}
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'add-product' && (
          <Card className="admin-card shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">
                {editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}
              </CardTitle>
              <CardDescription>
                {editingProduct ? 'Modifica los detalles del producto seleccionado.' : 'Completa el formulario para añadir un nuevo artículo.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductForm 
                product={editingProduct}
                onSuccess={() => {
                  setEditingProduct(null);
                  setActiveTab('products');
                  refetchData(); // Refetch after add/edit
                }}
                onCancel={() => {
                  setEditingProduct(null);
                  setActiveTab(editingProduct ? 'products' : 'overview');
                }}
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'settings' && (
          <Card className="admin-card shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Configuración de la Tienda</CardTitle>
              <CardDescription>Personaliza la información general, apariencia y datos de contacto de tu tienda.</CardDescription>
            </CardHeader>
            <CardContent>
              <StoreSettings />
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  if (authLoading || (!isAuthenticated && !authLoading)) { // Show loading or redirect if not authenticated
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
            <p className="text-xl text-gray-600">Cargando panel de administración...</p>
        </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      <motion.div
        initial={{ x: -288 }} 
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="w-72 admin-sidebar text-white p-6 flex flex-col shadow-2xl fixed h-full z-20"
      >
        <div className="mb-10 text-center">
          <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-purple-300" />
          <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-blue-300">
            {storeConfig?.name || "Admin Panel"}
          </h1>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-wider">Panel de Administración</p>
        </div>

        <nav className="space-y-2 flex-grow">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id !== 'add-product') setEditingProduct(null);
                }}
                className={`nav-item w-full flex items-center space-x-3 px-4 py-3 text-left text-slate-200 hover:text-white rounded-lg transition-all duration-200 ease-in-out
                  ${activeTab === item.id ? 'active font-semibold shadow-lg' : 'hover:bg-slate-700/60'}`
                }
              >
                <Icon className={`h-5 w-5 ${activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                <span className="group-hover:text-white">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-700">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50 mb-2 transition-colors duration-200"
            onClick={() => navigate('/')}
          >
            <Eye className="mr-3 h-4 w-4" />
            Ver Tienda
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors duration-200"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </motion.div>

      <main className="flex-1 p-8 lg:p-12 overflow-y-auto ml-72"> {/* ml-72 para compensar el sidebar fijo */}
        <motion.div
          key={activeTab} 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="max-w-full" 
        >
          {renderContent()}
        </motion.div>
      </main>
    </div>
  );
};

export default AdminDashboard;