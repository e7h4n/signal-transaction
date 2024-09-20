import { Action, ActionRollback, Transaction } from "../types/transaction"

export function transaction(signal: AbortSignal): Transaction {
    const cleanupFns: ActionRollback[] = []

    function act(action: Action): void {
        signal.throwIfAborted()

        const cleanup = action()

        if (cleanup) {
            signal.addEventListener('abort', cleanup)
            cleanupFns.push(cleanup)
        }
    }

    function finish(action?: Action) {
        for (const fn of cleanupFns) {
            signal.removeEventListener('abort', fn)
        }

        if (!action) {
            return;
        }

        act(action)
    }

    return {
        act,
        finish,
    }
}
