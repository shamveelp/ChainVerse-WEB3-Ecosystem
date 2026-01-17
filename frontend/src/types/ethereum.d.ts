export interface EthereumProvider {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on: (eventName: string, handler: (...args: unknown[]) => void) => void;
    removeListener: (eventName: string, handler: (...args: unknown[]) => void) => void;
    isMetaMask?: boolean;
    [key: string]: unknown;
}

declare global {
    interface Window {
        ethereum?: EthereumProvider;
    }
}
