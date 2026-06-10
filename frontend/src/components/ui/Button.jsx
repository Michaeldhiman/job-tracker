import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function Button({ children, className, variant = 'primary', size = 'md', disabled = false, ...props }) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none gap-2';
  
  const variants = {
    primary: 'bg-primary hover:bg-primary-hover text-white shadow-sm border-t border-white/10',
    secondary: 'bg-transparent hover:bg-white/5 border border-border text-text',
    ghost: 'bg-transparent hover:bg-white/5 text-text-muted hover:text-text',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-8 py-3 text-base',
    icon: 'h-10 w-10',
  };

  return (
    <button
      className={twMerge(clsx(baseClasses, variants[variant], sizes[size], className))}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;

