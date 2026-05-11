"use client";

import { useFormStatus } from "react-dom";

type ConfirmButtonProps = {
  children: React.ReactNode;
  message: string;
  className?: string;
};

export function ConfirmButton({ children, message, className }: ConfirmButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      className={className}
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      type="submit"
    >
      {pending ? "Procesando..." : children}
    </button>
  );
}
