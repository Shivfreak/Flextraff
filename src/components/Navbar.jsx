import { useSelector } from 'react-redux';
import { User, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { role } = useSelector((state) => state.auth);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-md border-b border-slate-700/50 h-16 flex items-center px-8 justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Clock size={16} className="text-blue-400" />
          <span>{time.toLocaleTimeString()}</span>
        </div>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="System Online"></div>
        <span className="text-xs text-green-400">System Online</span>
      </div>

      <div className="flex items-center gap-3 bg-slate-700/50 px-4 py-2 rounded-lg border border-slate-600/50 hover:border-blue-500/30 transition-colors">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
          <User size={16} className="text-white" />
        </div>
        <div>
          <p className="text-xs text-slate-400">Logged in as</p>
          <p className="text-sm font-semibold text-white capitalize">{role}</p>
        </div>
      </div>
    </header>
  );
}