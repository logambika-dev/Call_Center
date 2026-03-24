'use client';
import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const inputBase = cn(
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900',
  'placeholder:text-gray-400 transition-colors',
  'hover:border-gray-300',
  'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15',
  'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
);

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  prefix?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, prefix, className, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span className="absolute inset-y-0 left-3.5 flex items-center text-gray-400 text-sm pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(inputBase, prefix && 'pl-9', error && 'border-red-400 focus:border-red-500 focus:ring-red-200', className)}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  ),
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  charCount?: number;
  maxChars?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, charCount, maxChars, className, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
            {label}
          </label>
          {maxChars && (
            <span className={cn('text-xs tabular-nums', (charCount ?? 0) > maxChars * 0.9 ? 'text-amber-500' : 'text-gray-400')}>
              {charCount ?? 0} / {maxChars}
            </span>
          )}
        </div>
      )}
      <textarea
        ref={ref}
        id={id}
        className={cn(inputBase, 'resize-none leading-relaxed', error && 'border-red-400', className)}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  ),
);
Textarea.displayName = 'Textarea';
