import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, ...props }, ref) => {
  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-white mb-2">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full px-4 py-3 border-2 rounded-xl shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 backdrop-blur-sm ${
          error ? 'border-red-500 bg-red-50 hover:bg-red-100' : 'border-slate-300 bg-white/70 hover:bg-white hover:border-blue-400'
        }`}
        {...props}
      />
      {error && (
        <p className="mt-2 text-sm font-medium text-red-600">❌ {error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

