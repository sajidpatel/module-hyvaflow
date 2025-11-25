import type { HyvaFlowCore } from './core';
export type LoaderScriptConfig = {
    url: string;
    id?: string;
    deps?: string[];
    async?: boolean;
    defer?: boolean;
    attributes?: Record<string, string>;
};
export type LoaderQueueItem = LoaderScriptConfig & {
    promise?: Promise<void>;
    loaded?: boolean;
    error?: Error;
};
export interface HyvaFlowLoader {
    load(urlOrConfig: string | LoaderScriptConfig): Promise<void>;
    loadQueue(configs: LoaderScriptConfig[]): Promise<void>;
    isLoaded(idOrUrl: string): boolean;
    getLoaded(): string[];
    clear(): void;
}
declare const createLoader: (core: HyvaFlowCore) => HyvaFlowLoader;
export default createLoader;
