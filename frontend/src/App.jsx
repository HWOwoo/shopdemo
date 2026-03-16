import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleRoute from './components/auth/RoleRoute';
import ShopPage from './pages/ShopPage';
import GoodsDetailPage from './pages/GoodsDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SellerDashboard from './pages/seller/SellerDashboard';
import CreateGoodsPage from './pages/seller/CreateGoodsPage';
import SellerGoodsDetailPage from './pages/seller/SellerGoodsDetailPage';
import SellerApplyPage from './pages/seller/SellerApplyPage';
import EditGoodsPage from './pages/seller/EditGoodsPage';
import SellerOrdersPage from './pages/seller/SellerOrdersPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPendingPage from './pages/admin/AdminPendingPage';
import AdminReviewPage from './pages/admin/AdminReviewPage';
import AdminSellerApplicationsPage from './pages/admin/AdminSellerApplicationsPage';
import AdminSellerReviewPage from './pages/admin/AdminSellerReviewPage';
import ProfileEditPage from './pages/ProfileEditPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <ShopPage /> },
      { path: 'goods/:id', element: <GoodsDetailPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      {
        path: 'seller/apply',
        element: <ProtectedRoute><SellerApplyPage /></ProtectedRoute>,
      },
      {
        path: 'seller/dashboard',
        element: <RoleRoute role="SELLER"><SellerDashboard /></RoleRoute>,
      },
      {
        path: 'seller/goods/new',
        element: <RoleRoute role="SELLER"><CreateGoodsPage /></RoleRoute>,
      },
      {
        path: 'seller/goods/:id',
        element: <RoleRoute role="SELLER"><SellerGoodsDetailPage /></RoleRoute>,
      },
      {
        path: 'seller/goods/:id/edit',
        element: <RoleRoute role="SELLER"><EditGoodsPage /></RoleRoute>,
      },
      {
        path: 'seller/orders',
        element: <RoleRoute role="SELLER"><SellerOrdersPage /></RoleRoute>,
      },
      {
        path: 'admin/dashboard',
        element: <RoleRoute role="ADMIN"><AdminDashboard /></RoleRoute>,
      },
      {
        path: 'admin/goods/pending',
        element: <RoleRoute role="ADMIN"><AdminPendingPage /></RoleRoute>,
      },
      {
        path: 'admin/goods/:id/review',
        element: <RoleRoute role="ADMIN"><AdminReviewPage /></RoleRoute>,
      },
      {
        path: 'admin/seller-applications',
        element: <RoleRoute role="ADMIN"><AdminSellerApplicationsPage /></RoleRoute>,
      },
      {
        path: 'admin/seller-applications/:id/review',
        element: <RoleRoute role="ADMIN"><AdminSellerReviewPage /></RoleRoute>,
      },
      {
        path: 'profile/edit',
        element: <ProtectedRoute><ProfileEditPage /></ProtectedRoute>,
      },
      { path: 'unauthorized', element: <UnauthorizedPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
