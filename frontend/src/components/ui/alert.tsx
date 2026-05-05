import * as React from 'react'
import { cn } from '@/lib/utils'

const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn('rounded-lg border border-slate-700 p-4 text-sm', className)} {...props} />
))
Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h5 ref={ref} className={cn('mb-1 font-medium leading-none tracking-tight', className)} {...props} />
))
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm text-slate-400', className)} {...props} />
))
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription }
