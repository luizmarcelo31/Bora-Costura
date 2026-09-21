import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[transform,background-color,box-shadow,opacity] duration-150 ease-out active:not-disabled:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-denim",
  {
    variants: {
      variant: {
        primary: "bg-denim text-denim-fg shadow-[0_1px_0_rgb(27_29_36/0.12)] hover:bg-denim/90",
        secondary: "bg-raised text-ink shadow-[0_0_0_1px_var(--color-line)] hover:bg-surface",
        ghost: "bg-transparent text-ink hover:bg-wash",
        danger: "bg-brick text-denim-fg hover:bg-brick/90",
        sage: "bg-sage text-denim-fg hover:bg-sage/90",
      },
      size: {
        md: "h-11 px-4",
        sm: "h-9 px-3 text-[13px]",
        lg: "h-12 px-5",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

const fieldClass =
  "h-11 w-full rounded-md border-0 bg-raised px-3 text-sm text-ink shadow-[0_0_0_1px_var(--color-line)] placeholder:text-subtle outline-none transition-[box-shadow] duration-150 focus:shadow-[0_0_0_2px_var(--color-denim)]";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(fieldClass, "h-24 min-h-20 resize-y py-2.5", className)}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldClass, "pr-8", className)} {...props} />;
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-[12px] font-medium tracking-wide text-muted", className)}
      {...props}
    />
  );
}

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "denim" | "sage" | "amber" | "brick";
  className?: string;
}) {
  const tones = {
    neutral: "bg-wash text-ink",
    denim: "bg-denim/10 text-denim",
    sage: "bg-sage/10 text-sage",
    amber: "bg-amber/12 text-amber",
    brick: "bg-brick/10 text-brick",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
