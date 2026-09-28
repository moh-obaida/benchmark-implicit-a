"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

export function ActionForm({
  action,
  children,
  className,
}: {
  action: (formData: FormData) => Promise<{ error?: string } | void | null>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(async (_previous: { error?: string } | null, formData: FormData) => {
    const result = await action(formData);
    if (result && "error" in result && result.error) return { error: result.error };
    return null;
  }, null);

  return (
    <form action={formAction} className={className}>
      {state?.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      {children}
    </form>
  );
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn" type="submit" disabled={pending}>
      {pending ? "جارٍ الحفظ…" : children}
    </button>
  );
}

export function ConfirmButton({ label, message }: { label: string; message: string }) {
  return (
    <button
      className="btn-danger"
      type="submit"
      onClick={(event) => {
        if (!confirm(message)) event.preventDefault();
      }}
    >
      {label}
    </button>
  );
}
