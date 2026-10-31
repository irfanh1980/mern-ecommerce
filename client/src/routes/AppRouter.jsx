import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import Navbar from '../components/layout/Navbar.jsx';
import Home from '../pages/Home.jsx';
import Products from '../pages/Products.jsx';
import ProductDetail from '../pages/ProductDetail.jsx';
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';
import Checkout from '../pages/Checkout.jsx';
import SellerStorefront from '../pages/SellerStorefront.jsx';
import SellerProfile from '../pages/SellerProfile.jsx';
import SellerDashboard from '../pages/SellerDashboard.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import AddProduct from '../pages/AddProduct.jsx';
import VerifyEmail from '../pages/VerifyEmail.jsx';
import AdminDashboard from '../pages/AdminDashboard.jsx';
import Cart from '../pages/Cart.jsx';
import MyOrders from '../pages/MyOrders.jsx';
import ChangePassword from '../pages/ChangePassword.jsx';
import Messaging from '../pages/Messaging.jsx';

export default function AppRouter() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/seller/:id" element={<SellerProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/my-orders" element={<MyOrders />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute roles={['Buyer']}>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/add-product"
            element={
              <ProtectedRoute roles={['Seller', 'Both']}>
                <AddProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/dashboard"
            element={
              <ProtectedRoute roles={['Seller', 'Both']}>
                <SellerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['Admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
           <Route
             path="/change-password"
             element={
               <ProtectedRoute>
                 <ChangePassword />
               </ProtectedRoute>
             }
           />
             <Route path="/seller/storefront" element={<SellerStorefront />} />
           <Route path="/verify-email/:token" element={<VerifyEmail />} />
           <Route
             path="/messaging"
             element={
               <ProtectedRoute>
                 <Messaging />
               </ProtectedRoute>
             }
           />
           </Routes>
      </main>
    </>
  );
}
