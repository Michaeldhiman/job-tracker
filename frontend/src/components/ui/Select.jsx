function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>}
      <select
        className={`w-full px-4 py-3 border-2 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300 bg-white/70 hover:bg-white hover:border-blue-400 backdrop-blur-sm ${
          error ? 'border-red-500' : 'border-slate-300'
        }`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-2 text-sm font-medium text-red-600">❌ {error}</p>}
    </div>
  );
}

export default Select;

