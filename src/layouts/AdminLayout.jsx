import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-blue-950/10 to-slate-950 text-slate-200 font-sans">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-b from-slate-900/30 to-slate-950/50 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}