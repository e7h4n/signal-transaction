
type WrappedFn<Args extends unknown[], ReturnType> = (signal: AbortSignal, ...args: Args) => ReturnType

export function createSignalSwitch(signal: AbortSignal) {
    let controller: AbortController | null = null;
    function recreateChildSignal(): AbortSignal {
        controller?.abort()
        controller = new AbortController()
        return AbortSignal.any([signal, controller.signal])
    }

    function wrapper(): () => AbortSignal;
    function wrapper<Args extends unknown[], ReturnType>(fn: WrappedFn<Args, ReturnType>): (...args: Args) => ReturnType;
    function wrapper<Args extends unknown[], ReturnType>(fn?: WrappedFn<Args, ReturnType>) {

        if (!fn) {
            return () => recreateChildSignal()
        }

        return function (...args: Args): ReturnType {
            return fn(recreateChildSignal(), ...args);
        };
    };

    return wrapper;
}