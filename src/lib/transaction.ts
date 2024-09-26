import { Transaction, TransactionAction } from "../types/transaction"

class TransactionImpl implements Transaction {
    constructor(private readonly signal: AbortSignal) {

    }

    act: TransactionAction = (action) => {
        const cleanup = action()

        if (cleanup) {
            this.signal.addEventListener('abort', cleanup)
        }
    }
}

export function transaction(signal: AbortSignal): Transaction {
    return new TransactionImpl(signal)
}
