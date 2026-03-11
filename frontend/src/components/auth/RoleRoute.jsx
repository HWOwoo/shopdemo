import { Navigate } from 'react-router-dom';
import { useAuth } from '../../store/authStore';

export default function RoleRoute({ role, children }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== role) return <Navigate to="/unauthorized" replace />;
  return children;
}
