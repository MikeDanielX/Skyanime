import type { HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

// clsx mínimo: el hub no trae clsx y no hace falta traerlo por 3 componentes.
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

// Contenedor de ancho completo con padding responsive (paridad con SkyAnime).
export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("w-full px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

interface SectionProps {
  title?: string;
  className?: string;
  children: ReactNode;
  rightContent?: ReactNode;
}

// Título con la barra roja a la izquierda — identidad visual de SkyAnime.
export function Section({ title, children, className, rightContent }: SectionProps) {
  return (
    <section className={className}>
      <Container>
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="border-l-4 border-red-600 pl-2 text-2xl font-bold">{title}</h2>
            {rightContent}
          </div>
        )}
        {children}
      </Container>
    </section>
  );
}

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "overflow-hidden rounded-xl border border-gray-700 bg-gray-900/80 shadow-lg",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        "w-full rounded-md border border-gray-600 bg-black/60 px-3 py-2 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500",
        className,
      )}
      {...props}
    />
  );
}

type BadgeVariant = "default" | "subtle" | "success";

export function Badge({
  variant = "default",
  className,
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}) {
  const variants: Record<BadgeVariant, string> = {
    default: "bg-red-600/20 text-red-300 border border-red-600/60",
    subtle: "bg-gray-700 text-gray-200",
    success: "bg-emerald-600/20 text-emerald-300 border border-emerald-600/60",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-lg bg-gray-700 shadow-lg">
      <div className="h-64 w-full bg-gray-600" />
      <div className="p-4">
        <div className="mb-2 h-6 w-3/4 rounded bg-gray-600" />
        <div className="h-4 w-1/2 rounded bg-gray-600" />
      </div>
    </div>
  );
}
