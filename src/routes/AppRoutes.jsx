import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Layouts
import AdminLayout from '../layouts/AdminLayout';
import UserLayout from '../layouts/UserLayout';

// Pages
import Login from '../pages/Login';
import AdminDashboard from '../pages/admin/Dashboard';
import AdminControls from '../pages/admin/Controls';
import AdminJunctions from '../pages/admin/Junctions';
import AdminLogs from '../pages/admin/Logs';
import AdminScanners from '../pages/admin/Scanners';
import AdminUsers from '../pages/admin/Users';
import AdminAssignments from '../pages/admin/Assignments';
import UserDashboard from '../pages/user/Dashboard';
import UserControls from '../pages/user/Controls';
import UserLogs from '../pages/user/Logs';

export default function AppRoutes() {
  const { isAuthenticated, role } = useSelector((state) => state.auth);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Public Route */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to={`/${role}`} replace /> : <Login />} 
      />

      {/* Protected Admin Routes */}
      <Route 
        path="/admin" 
        element={isAuthenticated && role === 'admin' ? <AdminLayout /> : <Navigate to="/login" replace />}
      >
        <Route index element={<AdminDashboard />} />
        <Route path="junctions" element={<AdminJunctions />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="assignments" element={<AdminAssignments />} />
        <Route path="controls" element={<AdminControls />} />
        <Route path="logs" element={<AdminLogs />} />
        <Route path="scanners" element={<AdminScanners />} />
      </Route>

      {/* Protected User Routes */}
      <Route 
        path="/user" 
        element={isAuthenticated && role === 'user' ? <UserLayout /> : <Navigate to="/login" replace />}
      >
        <Route index element={<UserDashboard />} />
        <Route path="controls" element={<UserControls />} />
        <Route path="logs" element={<UserLogs />} />
      </Route>
    </Routes>
  );
}