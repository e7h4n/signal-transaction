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
    let txnCtrl = new AbortController()

    function act(action: Action): void {
        signal.throwIfAborted()

        const cleanup = action()

        if (cleanup) {
            signal.addEventListener('abort', cleanup, { signal: txnCtrl.signal })
        }
    }

    function finish(action?: Action) {
        txnCtrl.abort()
        txnCtrl = new AbortController()

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
