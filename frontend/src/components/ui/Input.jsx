import { forwardRef } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const Input = forwardRef(({ className, type, label, error, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-semibold text-zinc-200">
          {label}
        </label>
      )}
      <input
        type={type}
        className={twMerge(
          clsx(
            "flex h-11 w-full rounded-xl border border-white/10 hover:border-white/20 bg-zinc-950/40 px-3.5 py-2 text-sm text-white transition-all placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-rose-500 focus:ring-rose-500 focus:border-rose-500",
            className
          )
        )}
        ref={ref}
        {...props}
      />
      {error && <span className="text-xs text-rose-500 mt-1">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
