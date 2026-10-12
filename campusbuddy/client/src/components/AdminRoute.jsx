import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/** Only lets admins through. The server checks the role again on every request. */
export default function AdminRoute() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
