import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppLayout from './components/AppLayout.jsx';
import Landing from './pages/Landing.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Assistant from './pages/Assistant.jsx';
import Schedule from './pages/Schedule.jsx';
import MapPage from './pages/MapPage.jsx';
import Courses from './pages/Courses.jsx';
import Settings from './pages/Settings.jsx';
import Help from './pages/Help.jsx';
import NotFound from './pages/NotFound.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Admin from './pages/Admin.jsx';
import AdminRoute from './components/AdminRoute.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<Help />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
