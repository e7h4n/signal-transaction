import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'happy-dom',
        coverage: {
            reporter: ['text', 'json-summary', 'json', 'cobertura'],
            provider: 'v8'
        },
    },
})
