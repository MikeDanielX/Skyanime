import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

// Componentes UI compartidos. Consistencia visual = look "pro" con poco esfuerzo.

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const styles = {
    primary: "bg-accent hover:bg-accent-hover text-white",
    ghost: "bg-transparent hover:bg-surface-border text-slate-300",
    danger: "bg-red-600/90 hover:bg-red-600 text-white",
  }[variant];
  return (
    <button
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${styles} ${className}`}
      {...props}
    />
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-accent ${className}`}
      {...props}
    />
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-surface-border bg-surface-raised p-5 ${className}`}>{children}</div>
  );
}

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "green" | "blue" | "amber" | "red" }) {
  const tones = {
    neutral: "bg-slate-700/50 text-slate-300",
    green: "bg-green-500/15 text-green-400",
    blue: "bg-blue-500/15 text-blue-400",
    amber: "bg-amber-500/15 text-amber-400",
    red: "bg-red-500/15 text-red-400",
  }[tone];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tones}`}>{label}</span>;
}
