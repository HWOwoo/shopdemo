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
import MyOrdersPage from './pages/MyOrdersPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPendingPage from './pages/admin/AdminPendingPage';
import AdminReviewPage from './pages/admin/AdminReviewPage';
import AdminSellerApplicationsPage from './pages/admin/AdminSellerApplicationsPage';
import AdminSellerReviewPage from './pages/admin/AdminSellerReviewPage';
import AdminCancelRequestsPage from './pages/admin/AdminCancelRequestsPage';
import ProfileEditPage from './pages/ProfileEditPage';
import NotificationsPage from './pages/NotificationsPage';
import MyReviewsPage from './pages/MyReviewsPage';
import MyPreordersPage from './pages/MyPreordersPage';
import MyWishlistPage from './pages/MyWishlistPage';
import MyPage from './pages/MyPage';
import SellerProfilePage from './pages/SellerProfilePage';
import SellerSettlementsPage from './pages/seller/SellerSettlementsPage';
import SellerPreordersPage from './pages/seller/SellerPreordersPage';
import AdminSettlementsPage from './pages/admin/AdminSettlementsPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';
import ChatListPage from './pages/ChatListPage';
import ChatRoomPage from './pages/ChatRoomPage';
import NoticesPage from './pages/NoticesPage';
import NoticeDetailPage from './pages/NoticeDetailPage';
import AdminNoticesPage from './pages/admin/AdminNoticesPage';
import AdminNoticeEditPage from './pages/admin/AdminNoticeEditPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminGoodsPage from './pages/admin/AdminGoodsPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <ShopPage /> },
      { path: 'goods/:id', element: <GoodsDetailPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'seller/:username', element: <SellerProfilePage /> },
      { path: 'notices', element: <NoticesPage /> },
      { path: 'notices/:id', element: <NoticeDetailPage /> },
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
        path: 'seller/settlements',
        element: <RoleRoute role="SELLER"><SellerSettlementsPage /></RoleRoute>,
      },
      {
        path: 'seller/preorders/:goodsId',
        element: <RoleRoute role="SELLER"><SellerPreordersPage /></RoleRoute>,
      },
      {
        path: 'admin/dashboard',
        element: <RoleRoute role="ADMIN"><AdminDashboard /></RoleRoute>,
      },
      {
        path: 'admin/goods',
        element: <RoleRoute role="ADMIN"><AdminGoodsPage /></RoleRoute>,
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
        path: 'admin/orders/cancel-requests',
        element: <RoleRoute role="ADMIN"><AdminCancelRequestsPage /></RoleRoute>,
      },
      {
        path: 'admin/settlements',
        element: <RoleRoute role="ADMIN"><AdminSettlementsPage /></RoleRoute>,
      },
      {
        path: 'admin/orders',
        element: <RoleRoute role="ADMIN"><AdminOrdersPage /></RoleRoute>,
      },
      {
        path: 'admin/users',
        element: <RoleRoute role="ADMIN"><AdminUsersPage /></RoleRoute>,
      },
      {
        path: 'admin/notices',
        element: <RoleRoute role="ADMIN"><AdminNoticesPage /></RoleRoute>,
      },
      {
        path: 'admin/notices/new',
        element: <RoleRoute role="ADMIN"><AdminNoticeEditPage /></RoleRoute>,
      },
      {
        path: 'admin/notices/:id/edit',
        element: <RoleRoute role="ADMIN"><AdminNoticeEditPage /></RoleRoute>,
      },
      {
        path: 'my',
        element: <ProtectedRoute><MyPage /></ProtectedRoute>,
      },
      {
        path: 'my/orders',
        element: <ProtectedRoute><MyOrdersPage /></ProtectedRoute>,
      },
      {
        path: 'my/reviews',
        element: <ProtectedRoute><MyReviewsPage /></ProtectedRoute>,
      },
      {
        path: 'my/preorders',
        element: <ProtectedRoute><MyPreordersPage /></ProtectedRoute>,
      },
      {
        path: 'my/wishlist',
        element: <ProtectedRoute><MyWishlistPage /></ProtectedRoute>,
      },
      {
        path: 'chat',
        element: <ProtectedRoute><ChatListPage /></ProtectedRoute>,
      },
      {
        path: 'chat/:roomId',
        element: <ProtectedRoute><ChatRoomPage /></ProtectedRoute>,
      },
      {
        path: 'notifications',
        element: <ProtectedRoute><NotificationsPage /></ProtectedRoute>,
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
