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

    test('Throws Error on Aborted Signal', () => {
        const { act } = transaction(AbortSignal.abort())

        expect(() => {
            act(() => void (0))
        }).toThrow()
    })
})
