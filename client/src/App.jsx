import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Profile from './pages/Profile.jsx';
import Products from './pages/Products.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Categories from './pages/Categories.jsx';
import Category from './pages/Category.jsx';
import Cart from './pages/Cart.jsx';
import Wishlist from './pages/Wishlist.jsx';
import Checkout from './pages/Checkout.jsx';
import NotFound from './pages/NotFound.jsx';
import Unauthorized from './pages/Unauthorized.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RoleProtectedRoute from './components/RoleProtectedRoute.jsx';
import CartDrawer from './components/CartDrawer.jsx';

import AdminLayout from './layouts/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminAnalytics from './pages/admin/AdminAnalytics.jsx';
import AdminModels from './pages/admin/AdminModels.jsx';
import AdminRetraining from './pages/admin/AdminRetraining.jsx';
import AdminCatalogue from './pages/admin/AdminCatalogue.jsx';
import AdminBusinessRules from './pages/admin/AdminBusinessRules.jsx';

import ContentManagerLayout from './layouts/ContentManagerLayout.jsx';
import CMDashboard from './pages/content-manager/CMDashboard.jsx';
import CMProducts from './pages/content-manager/CMProducts.jsx';
import CMProductNew from './pages/content-manager/CMProductNew.jsx';
import CMCategories from './pages/content-manager/CMCategories.jsx';

export default function App() {
  return (
    <>
      <CartDrawer />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/products" element={<Products />} />
          <Route path="/search" element={<Products />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/category/:slug" element={<Category />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>

      {/* Administrator dashboard — dedicated shell, no storefront navbar/footer */}
      <Route
        path="/admin"
        element={
          <RoleProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout />
          </RoleProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="models" element={<AdminModels />} />
        <Route path="retraining" element={<AdminRetraining />} />
        <Route path="catalogue" element={<AdminCatalogue />} />
        <Route path="business-rules" element={<AdminBusinessRules />} />
      </Route>

      {/* Content Manager dashboard — dedicated shell */}
      <Route
        path="/content-manager"
        element={
          <RoleProtectedRoute allowedRoles={['CONTENT_MANAGER']}>
            <ContentManagerLayout />
          </RoleProtectedRoute>
        }
      >
        <Route index element={<CMDashboard />} />
        <Route path="products" element={<CMProducts />} />
        <Route path="products/new" element={<CMProductNew />} />
        <Route path="categories" element={<CMCategories />} />
      </Route>
      </Routes>
    </>
  );
}