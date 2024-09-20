import { ActionRollback, Transaction, TransactionAction, TransactionFinish } from "../types/transaction"

class TransactionImpl implements Transaction {
    private readonly cleanupFns: ActionRollback[] = []

    constructor(private readonly signal: AbortSignal) {

    }

    act: TransactionAction = (action) => {
        this.signal.throwIfAborted()

        const cleanup = action()

        if (cleanup) {
            this.signal.addEventListener('abort', cleanup)
            this.cleanupFns.push(cleanup)
        }
    }

    finish: TransactionFinish = (action) => {
        for (const fn of this.cleanupFns) {
            this.signal.removeEventListener('abort', fn)
        }
        this.cleanupFns.length = 0

        if (!action) {
            return;
        }

        this.act(action)
    }
}

export function transaction(signal: AbortSignal): Transaction {
    return new TransactionImpl(signal)
}
