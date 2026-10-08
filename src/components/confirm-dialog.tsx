"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PiAsteriskSimple } from "react-icons/pi";

export type Confirmation = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
};

function ConfirmDialog({
  request,
  onDecision,
}: {
  request: Confirmation | null;
  onDecision: (confirmed: boolean) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (request && !dialog.current?.open) dialog.current?.showModal();
    if (!request && dialog.current?.open) dialog.current.close();
  }, [request]);

  return (
    <dialog
      ref={dialog}
      className="studio-dialog"
      aria-labelledby="studio-dialog-title"
      aria-describedby="studio-dialog-message"
      onCancel={(event) => {
        event.preventDefault();
        onDecision(false);
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onDecision(false);
      }}
    >
      {request && (
        <div className="studio-dialog-panel">
          <PiAsteriskSimple className="studio-dialog-mark" aria-hidden="true" />
          <span className="eyebrow">A MOMENT BEFORE YOU GO</span>
          <h2 id="studio-dialog-title">{request.title}</h2>
          <p id="studio-dialog-message">{request.message}</p>
          <div className="studio-dialog-actions">
            <button
              type="button"
              className="button small"
              autoFocus
              onClick={() => onDecision(false)}
            >
              {request.cancelLabel || "Cancel"}
            </button>
            <button
              type="button"
              className={`button small ${request.tone === "danger" ? "dialog-danger" : "dark"}`}
              onClick={() => onDecision(true)}
            >
              {request.confirmLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

export function useConfirmation() {
  const [request, setRequest] = useState<Confirmation | null>(null);
  const resolver = useRef<((confirmed: boolean) => void) | null>(null);
  const confirm = useCallback(
    (options: Confirmation) =>
      new Promise<boolean>((resolve) => {
        resolver.current?.(false);
        resolver.current = resolve;
        setRequest(options);
      }),
    [],
  );
  const decide = useCallback((confirmed: boolean) => {
    resolver.current?.(confirmed);
    resolver.current = null;
    setRequest(null);
  }, []);
  useEffect(() => () => resolver.current?.(false), []);
  return {
    confirm,
    confirmationDialog: <ConfirmDialog request={request} onDecision={decide} />,
  };
}
