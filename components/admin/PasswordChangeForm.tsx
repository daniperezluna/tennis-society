"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { updateOwnPassword } from "@/app/admin/actions";

export function PasswordChangeForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);

  const mismatch = newPassword !== "" && confirmPassword !== "" && newPassword !== confirmPassword;
  const tooShort = newPassword !== "" && newPassword.length < 8;
  const inputType = show ? "text" : "password";

  return (
    <form
      action={updateOwnPassword}
      className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"
      onSubmit={(e) => {
        if (mismatch || tooShort) e.preventDefault();
      }}
    >
      <input
        autoComplete="current-password"
        className="rounded-lg bg-court-900 px-3 py-2"
        name="currentPassword"
        placeholder="Contraseña actual"
        required
        type={inputType}
      />
      <input
        autoComplete="new-password"
        className={`rounded-lg bg-court-900 px-3 py-2 ${tooShort ? "ring-1 ring-red-400/60" : ""}`}
        minLength={8}
        name="newPassword"
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="Nueva (mínimo 8)"
        required
        type={inputType}
        value={newPassword}
      />
      <input
        autoComplete="new-password"
        className={`rounded-lg bg-court-900 px-3 py-2 ${mismatch ? "ring-1 ring-red-400/60" : ""}`}
        minLength={8}
        name="confirmPassword"
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Repite la nueva"
        required
        type={inputType}
        value={confirmPassword}
      />
      <SubmitButton className="rounded-lg bg-ball-500 px-4 py-2 font-bold text-court-950">
        Cambiar
      </SubmitButton>
      <label className="md:col-span-4 flex items-center gap-2 text-xs text-text-muted">
        <input checked={show} onChange={(e) => setShow(e.target.checked)} type="checkbox" />
        Mostrar contraseñas
      </label>
      {(mismatch || tooShort) && (
        <p className="md:col-span-4 text-xs text-red-300">
          {tooShort ? "La nueva contraseña debe tener al menos 8 caracteres." : "Las contraseñas no coinciden."}
        </p>
      )}
    </form>
  );
}
