import { Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { BarChart2, MapPin, Sliders, FileText, ScanLine, LogOut, Settings, UserPlus, Link as LinkIcon } from 'lucide-react';

export default function Sidebar({ role }) {
  const location = useLocation();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  const adminLinks = [
    { name: 'Analytics', path: '/admin', icon: <BarChart2 size={20} /> },
    { name: 'Traffic Data', path: '/admin/junctions', icon: <MapPin size={20} /> },
    { name: 'Users', path: '/admin/users', icon: <UserPlus size={20} /> },
    { name: 'Assignments', path: '/admin/assignments', icon: <LinkIcon size={20} /> },
    { name: 'Controls', path: '/admin/controls', icon: <Sliders size={20} /> },
    { name: 'Logs', path: '/admin/logs', icon: <FileText size={20} /> },
    { name: 'Scanners', path: '/admin/scanners', icon: <ScanLine size={20} /> },
  ];

  const userLinks = [
    { name: 'Dashboard', path: '/user', icon: <BarChart2 size={20} /> },
    { name: 'Controls', path: '/user/controls', icon: <Sliders size={20} /> },
    { name: 'Logs', path: '/user/logs', icon: <FileText size={20} /> },
  ];

  const links = role === 'admin' ? adminLinks : userLinks;

  return (
    <div className="w-64 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800/50 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800/50">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xl">
          🚦
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">FlexTraff</h1>
          <p className="text-xs text-slate-400 capitalize">{role} Dashboard</p>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-2 mt-6">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span className={`transition-transform duration-200 ${
                isActive ? 'scale-110' : 'group-hover:scale-110'
              }`}>
                {link.icon}
              </span>
              <span className="font-medium">{link.name}</span>
              {isActive && <div className="ml-auto w-2 h-2 rounded-full bg-white"></div>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-800/50 space-y-2">
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors group"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
