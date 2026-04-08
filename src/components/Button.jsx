export default function Button({ children, onClick, variant = 'primary', className = '', ...props }) {
  const baseStyles = "font-semibold py-2 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40",
    secondary: "bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 border border-slate-600 hover:border-slate-500 shadow-md hover:shadow-lg",
    danger: "bg-red-500/10 border border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-500 shadow-md hover:shadow-lg",
    success: "bg-green-500/10 border border-green-500/50 text-green-400 hover:bg-green-500/20 hover:border-green-500 shadow-md hover:shadow-lg",
  };

  return (
    <button 
      onClick={onClick} 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}