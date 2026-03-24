import { cn } from '@/lib/utils';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'brand' | 'outline';

const variants: Record<Variant, string> = {
  default: 'bg-gray-100 text-gray-600',
  success: 'bg-green-50 text-green-700 border border-green-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  danger:  'bg-red-50 text-red-600 border border-red-200',
  brand:   'bg-brand-50 text-brand-700 border border-brand-200',
  outline: 'bg-white text-gray-600 border border-gray-200',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  dot?: boolean;
}

export function Badge({ children, variant = 'default', className, dot }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
      variants[variant], className,
    )}>
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', {
          'bg-gray-400':  variant === 'default',
          'bg-green-500': variant === 'success',
          'bg-amber-500': variant === 'warning',
          'bg-red-500':   variant === 'danger',
          'bg-brand-500': variant === 'brand',
        })} />
      )}
      {children}
    </span>
  );
}
