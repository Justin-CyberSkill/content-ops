import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";

const avatarVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-accent-foreground select-none",
  {
    variants: {
      size: {
        sm: "size-7 text-xs",
        default: "size-9 text-sm",
        lg: "size-16 text-xl",
        xl: "size-20 font-heading text-3xl",
      },
    },
    defaultVariants: { size: "default" },
  },
);

/** "Linh Tran" → "LT", "Justin" → "J". */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

/** Initials in a circle. Decorative: the name is always shown next to it. */
function Avatar({
  name,
  size,
  className,
  ...props
}: Omit<React.ComponentProps<"span">, "children"> &
  VariantProps<typeof avatarVariants> & { name: string }) {
  return (
    <span
      data-slot="avatar"
      aria-hidden="true"
      className={cn(avatarVariants({ size }), className)}
      {...props}
    >
      {initials(name)}
    </span>
  );
}

export { Avatar };
