// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type Action = () => void | ActionRollback
export type ActionRollback = (this: AbortSignal, ev: AbortSignalEventMap['abort']) => void

export type TransactionAction = (action: Action) => void
export type TransactionFinish = (action?: Action) => void

export interface Transaction {
    act: TransactionAction
    finish: TransactionFinish
}
