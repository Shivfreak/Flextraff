import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginAsync, clearError } from '../features/auth/authSlice';
import { Lock, User, ShieldCheck, LayoutGrid } from 'lucide-react';

const roleDetails = {
  admin: {
    title: 'Administrator',
    description: 'Manage traffic systems, junctions, and scanner health across the network.',
    accent: 'from-slate-800 via-blue-950 to-slate-950',
    button: 'from-blue-500 to-cyan-400',
  },
  user: {
    title: 'Junction Operator',
    description: 'Monitor local junction data and execute manual control overrides.',
    accent: 'from-slate-800 via-emerald-950 to-slate-950',
    button: 'from-emerald-500 to-lime-400',
  },
};

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('admin');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const { error } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await dispatch(loginAsync({ username, password, selectedRole })).unwrap();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const activeRole = roleDetails[selectedRole];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-10 top-10 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl animate-pulse"></div>
        <div className="absolute right-10 bottom-10 w-80 h-80 rounded-full bg-green-500/10 blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 grid gap-6 md:grid-cols-[1.2fr_1fr] items-stretch w-full max-w-6xl">
        <div className="bg-slate-900/90 border border-slate-700/70 rounded-3xl p-10 shadow-2xl shadow-slate-950/40 backdrop-blur-xl overflow-hidden">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-500/20">
              🚦
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">FlexTraff</p>
              <h1 className="text-4xl font-bold text-white">Choose your access panel</h1>
            </div>
          </div>

          <div className="grid gap-4">
            {(['admin', 'user']).map((role) => {
              const roleInfo = roleDetails[role];
              const isActive = role === selectedRole;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`rounded-3xl p-6 text-left border transition-all duration-300 ${isActive ? 'border-blue-400/40 bg-slate-800 shadow-xl shadow-blue-500/10' : 'border-slate-700/40 bg-slate-950/70 hover:border-slate-500/60 hover:bg-slate-900/80'}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-400 uppercase tracking-[0.3em]">{roleInfo.title}</p>
                      <h2 className="text-2xl font-semibold text-white mt-2">{roleInfo.title} Panel</h2>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-300">
                      {role === 'admin' ? <ShieldCheck size={24} /> : <LayoutGrid size={24} />}
                    </div>
                  </div>
                  <p className="mt-4 text-slate-400 leading-6">{roleInfo.description}</p>
                </button>
              );
            })}
          </div>

          
        </div>

        <div className="bg-slate-900/95 border border-slate-700/70 rounded-3xl p-10 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="flex flex-col gap-4 mb-10">
            <div className="inline-flex items-center gap-3 rounded-3xl bg-slate-950/60 px-4 py-3 border border-slate-700/60">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-md shadow-blue-500/20">
                {selectedRole === 'admin' ? <ShieldCheck size={20} /> : <LayoutGrid size={20} />}
              </div>
              <div>
                <p className="text-sm text-slate-400">Signing in as</p>
                <h2 className="text-xl font-semibold text-white">{activeRole.title}</h2>
              </div>
            </div>

            <div className="text-slate-400 text-sm leading-6">
              <p>{activeRole.description}</p>
              <p className="mt-3 text-slate-500">Enter your credentials below to continue.</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/15 border border-red-500/50 text-red-400 p-4 rounded-2xl mb-6 text-sm flex items-center gap-3 animate-shake">
              <span className="text-lg">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  placeholder={selectedRole === 'admin' ? 'admin' : 'user'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-3xl px-14 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="password"
                  placeholder="password"
                  className="w-full bg-slate-900 border border-slate-700 rounded-3xl px-14 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full rounded-3xl py-4 text-white font-semibold transition-all duration-300 ${isLoading ? 'opacity-50 cursor-not-allowed' : `bg-gradient-to-r ${activeRole.button} hover:brightness-110`}`}
            >
              {isLoading ? 'Signing in...' : `Sign in as ${activeRole.title}`}
            </button>
          </form>

         
        </div>
      </div>
    </div>
  );
}