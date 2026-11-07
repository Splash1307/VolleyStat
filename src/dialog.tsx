import { useSyncExternalStore } from 'react';

// Boîte de dialogue intégrée (remplace confirm/alert, bloqués dans certains navigateurs intégrés).
interface Pending {
  message: string;
  ok: string;
  cancel?: string;
  danger?: boolean;
  resolve: (v: boolean) => void;
}

let current: Pending | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const open = (p: Omit<Pending, 'resolve'>) =>
  new Promise<boolean>((resolve) => {
    current?.resolve(false);
    current = { ...p, resolve };
    emit();
  });

export const ask = (message: string, opts: { ok?: string; danger?: boolean } = {}) =>
  open({ message, ok: opts.ok ?? 'Confirmer', cancel: 'Annuler', danger: opts.danger });

export const notify = (message: string) => open({ message, ok: 'OK' }).then(() => undefined);

const close = (v: boolean) => {
  const c = current;
  current = null;
  emit();
  c?.resolve(v);
};

export const DialogHost = () => {
  const p = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
  );
  if (!p) return null;
  return (
    <div className="modal-backdrop center-dialog" onClick={() => close(false)}>
      <div className="dialog" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <p>{p.message}</p>
        <div className="btn-row">
          {p.cancel && (
            <button className="btn grow" onClick={() => close(false)}>
              {p.cancel}
            </button>
          )}
          <button autoFocus className={`btn grow ${p.danger ? 'danger' : 'primary'}`} onClick={() => close(true)}>
            {p.ok}
          </button>
        </div>
      </div>
    </div>
  );
};
