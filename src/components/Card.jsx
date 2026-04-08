export default function Card({ title, children, className = '' }) {
  return (
    <div className={`bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-slate-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/10 ${className}`}>
      {title && <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">{title}</h3>}
      {children}
    </div>
  );
}