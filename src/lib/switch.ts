export function createSignalSwitch(signal: AbortSignal) {
    let controller: AbortController | null = null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function wrapper<Args extends any[], ReturnType>(fn: (signal: AbortSignal, ...args: Args) => ReturnType) {
        return function wrappedFn(...args: Args): ReturnType {
            if (controller) {
                controller.abort()
            }
            controller = new AbortController()

            return fn(AbortSignal.any([signal, controller.signal]), ...args);
        };
    };
}