function Button({ children, className = '', disabled = false, ...props }) {
  const baseClasses = 'px-4 py-2 rounded-xl font-semibold transition-all duration-300 transform';
  const variantClasses = disabled
    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
    : 'bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white hover:from-blue-700 hover:via-blue-800 hover:to-purple-700 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white shadow-lg backdrop-blur-sm';

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;

