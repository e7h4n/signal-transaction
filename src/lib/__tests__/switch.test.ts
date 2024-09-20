import { describe, expect, test, vi } from "vitest"
import { createSignalSwitch } from "../switch"
import { transaction } from "../transaction"

describe('signalSwitch', () => {
    test('auto aborts previous signal', () => {
        const ctrl = new AbortController()
        const trace = vi.fn()

        const signalSwitch = createSignalSwitch(ctrl.signal)
        let count = 0
        const fn = signalSwitch((signal) => {
            const { act } = transaction(signal)
            const contextId = count++;
            act(() => {
                trace(`init context ${String(contextId)}`)
                return () => {
                    trace(`rollback context ${String(contextId)}`)
                }
            })
        })

        expect(trace).not.toBeCalled()

        fn()
        expect(trace).toBeCalledTimes(1)
        expect(trace).lastCalledWith('init context 0')

        fn()
        expect(trace).toBeCalledTimes(3)
        expect(trace).toHaveBeenNthCalledWith(2, 'rollback context 0')
        expect(trace).toHaveBeenNthCalledWith(3, 'init context 1')
    })

    test('aborted when external signal abort', () => {
        const ctrl = new AbortController()
        const trace = vi.fn()

        const signalSwitch = createSignalSwitch(ctrl.signal)

        const fn = signalSwitch((signal) => {
            signal.addEventListener('abort', trace)
        })

        fn()
        ctrl.abort()
        expect(trace).toBeCalled()
    })

    test('should pass the signal through by default if no function is provided', () => {
        const ctrl = new AbortController()
        const trace = vi.fn()
        const signalSwitch = createSignalSwitch(ctrl.signal)()
        const signal = signalSwitch()
        signal.addEventListener('abort', trace)
        signalSwitch()
        expect(trace).toBeCalled()
    })

    test('signalSwitch should accpect correctly types', () => {
        const ctrl = new AbortController()
        const trace = vi.fn()

        const signalSwitch = createSignalSwitch(ctrl.signal)

        const fn = signalSwitch((signal, a: number, b: string, c: boolean) => {
            trace(a, b, c)
            signal.addEventListener('abort', trace)
        })

        fn(1, '1', true)
        ctrl.abort()
        expect(trace).toBeCalled()
    })
})