"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
  name?: string;
  value?: string;
};

export function SubmitButton({ children, className, pendingLabel, name, value }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      className={className}
      disabled={pending}
      name={name}
      type="submit"
      value={value}
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {pendingLabel ?? "Procesando..."}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
