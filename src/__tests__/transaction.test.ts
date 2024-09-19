import { delay } from 'signal-timers'
import { describe, expect, test } from "vitest"
import { transaction } from '..'

describe('transaction.act', () => {
    test('act Registers Action and Rollback', async () => {
        const { act } = transaction(AbortSignal.timeout(100))

        let count = 0
        act(
            () => {
                count += 1
                return () => {
                    count -= 1
                }
            },
        )

        expect(count).toBe(1)

        await delay(100)
        expect(count).toBe(0)
    })

    test('act throws Error on Aborted Signal', () => {
        const { act } = transaction(AbortSignal.abort())

        expect(() => {
            act(() => void (0))
        }).toThrow()
    })
})

describe('transaction.finish', () => {
    test('finish clears all rollbacks', () => {
        const controller = new AbortController()
        const { act, finish } = transaction(controller.signal)
        let name = ''

        act(() => {
            name = 'foo' + name
            return () => {
                name = name.substring(3)
            }
        })

        act(() => {
            name = 'hello: ' + name
            return () => {
                name = name.substring(7)
            }
        })

        finish()

        controller.abort()

        expect(name).toBe('hello: foo')
    })

    test('finish can register a last rollback', () => {
        const controller = new AbortController()
        const { act, finish } = transaction(controller.signal)
        let name = ''

        act(() => {
            name = 'foo' + name
            return () => {
                name = name.substring(3)
            }
        })

        act(() => {
            name = 'hello: ' + name
            return () => {
                name = name.substring(7)
            }
        })

        finish(() => {
            return () => {
                name = 'FINISH'
            }
        })

        expect(name).toBe('hello: foo')

        controller.abort()

        expect(name).toBe('FINISH')
    })
})