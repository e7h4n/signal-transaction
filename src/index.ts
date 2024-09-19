type ActionRollback = (this: AbortSignal, ev: AbortSignalEventMap['abort']) => void
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
type Action = () => void | ActionRollback
export type TransactionAction = (action: Action) => void
export type TransactionFinish = (action?: Action) => void

interface Transaction {
    act: TransactionAction
    finish: TransactionFinish
}

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
