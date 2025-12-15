const variants = {
  default: 'bg-slate-100 text-slate-800',
  success: 'bg-green-100 text-green-800 font-semibold',
  warning: 'bg-yellow-100 text-yellow-800 font-semibold',
  info: 'bg-blue-100 text-blue-800 font-semibold',
  danger: 'bg-red-100 text-red-800 font-semibold',
};

function Badge({ children, variant = 'default', className = '' }) {
  const variantClasses = variants[variant] || variants.default;
  return (
    <span className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm ${variantClasses} ${className}`}>
      {children}
    </span>
  );
}

export default Badge;

