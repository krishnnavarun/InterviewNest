import { useEffect, useRef } from 'react';
import { Button } from './button';

// Accessible confirm dialog built on <dialog> (no window.confirm).
export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', tone = 'danger', loading, onConfirm, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
      className="m-auto w-[min(92vw,420px)] rounded-2xl p-0 text-white backdrop:bg-ink-950/60 backdrop:backdrop-blur-sm"
    >
      <div className="surface-dark rounded-2xl p-6">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="mt-2 text-sm text-white/60">{description}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'light'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
