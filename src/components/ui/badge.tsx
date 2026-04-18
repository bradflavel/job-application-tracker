import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary ring-primary/20",
        secondary: "bg-secondary text-secondary-foreground ring-border",
        outline: "bg-transparent text-foreground ring-border",
        success: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
        warning: "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400",
        destructive:
          "bg-destructive/10 text-destructive ring-destructive/20",
        muted: "bg-muted text-muted-foreground ring-border",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
