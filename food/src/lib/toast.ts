import { writable } from 'svelte/store';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

function createToastStore() {
    const { subscribe, update } = writable<Toast[]>([]);

    function add(message: string, type: ToastType = 'info', duration = 3000) {
        const id = crypto.randomUUID();
        const toast = { id, type, message, duration };
        update((toasts) => [...toasts, toast]);

        if (duration > 0) {
            setTimeout(() => {
                dismiss(id);
            }, duration);
        }
    }

    function dismiss(id: string) {
        update((toasts) => toasts.filter((t) => t.id !== id));
    }

    return {
        subscribe,
        add,
        dismiss,
        info: (msg: string, duration?: number) => add(msg, 'info', duration),
        success: (msg: string, duration?: number) => add(msg, 'success', duration),
        warning: (msg: string, duration?: number) => add(msg, 'warning', duration),
        error: (msg: string, duration?: number) => add(msg, 'error', duration)
    };
}

export const toasts = createToastStore();
