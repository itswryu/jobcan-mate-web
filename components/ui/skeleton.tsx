import * as React from "react"

import { cn } from "@/lib/utils"

const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    className={cn("animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800", className)}
    ref={ref}
    {...props}
  />
))
Skeleton.displayName = "Skeleton"

export { Skeleton }