import { forwardRef } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const Input = forwardRef(({ className, type, label, error, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-medium text-text">
          {label}
        </label>
      )}
      <input
        type={type}
        className={twMerge(
          clsx(
            "flex h-10 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-text transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-rose-500 focus-visible:ring-rose-500",
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
