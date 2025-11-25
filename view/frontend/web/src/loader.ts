import { debugLog } from './eventBus';
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

const createLoader = (core: HyvaFlowCore): HyvaFlowLoader => {
    const loadedScripts = new Map<string, LoaderQueueItem>();
    const pendingScripts = new Map<string, Promise<void>>();

    const getScriptId = (urlOrConfig: string | LoaderScriptConfig): string => {
        if (typeof urlOrConfig === 'string') {
            return urlOrConfig;
        }
        return urlOrConfig.id || urlOrConfig.url;
    };

    const normalizeConfig = (urlOrConfig: string | LoaderScriptConfig): LoaderScriptConfig => {
        if (typeof urlOrConfig === 'string') {
            return { url: urlOrConfig };
        }
        return urlOrConfig;
    };

    const createScriptElement = (config: LoaderScriptConfig): HTMLScriptElement => {
        const script = document.createElement('script');
        script.src = config.url;

        if (config.async !== false) {
            script.async = true;
        }

        if (config.defer) {
            script.defer = true;
        }

        if (config.attributes) {
            Object.entries(config.attributes).forEach(([key, value]) => {
                script.setAttribute(key, value);
            });
        }

        return script;
    };

    const loadSingleScript = (config: LoaderScriptConfig): Promise<void> => {
        const scriptId = getScriptId(config);

        // Check if already loaded
        const cached = loadedScripts.get(scriptId);
        if (cached) {
            if (cached.error) {
                return Promise.reject(cached.error);
            }
            if (cached.loaded) {
                return Promise.resolve();
            }
        }

        // Check if currently loading
        const pending = pendingScripts.get(scriptId);
        if (pending) {
            return pending;
        }

        // Create new load promise
        const loadPromise = new Promise<void>((resolve, reject) => {
            const script = createScriptElement(config);

            const cleanup = () => {
                script.removeEventListener('load', onLoad);
                script.removeEventListener('error', onError);
            };

            const onLoad = () => {
                cleanup();
                debugLog(`Script loaded: ${scriptId}`);

                loadedScripts.set(scriptId, {
                    ...config,
                    loaded: true,
                });
                pendingScripts.delete(scriptId);

                core.trigger(core.ns('loader:complete'), {
                    url: config.url,
                    id: scriptId,
                });

                resolve();
            };

            const onError = (error: Event | string) => {
                cleanup();
                const err = new Error(`Failed to load script: ${config.url}`);
                debugLog(`Script load error: ${scriptId}`);

                loadedScripts.set(scriptId, {
                    ...config,
                    error: err,
                });
                pendingScripts.delete(scriptId);

                core.trigger(core.ns('loader:error'), {
                    url: config.url,
                    id: scriptId,
                    error: err,
                });

                reject(err);
            };

            script.addEventListener('load', onLoad);
            script.addEventListener('error', onError);

            core.trigger(core.ns('loader:start'), {
                url: config.url,
                id: scriptId,
            });

            document.head.appendChild(script);
        });

        pendingScripts.set(scriptId, loadPromise);
        return loadPromise;
    };

    const resolveDependencies = async (config: LoaderScriptConfig, allConfigs: Map<string, LoaderScriptConfig>): Promise<void> => {
        if (!config.deps || config.deps.length === 0) {
            return;
        }

        const depPromises = config.deps.map(async (depId) => {
            // Check if dependency is already loaded
            if (isLoaded(depId)) {
                return;
            }

            // Check if dependency config exists in the queue
            const depConfig = allConfigs.get(depId);
            if (depConfig) {
                // Recursively resolve dependencies
                await resolveDependencies(depConfig, allConfigs);
                await loadSingleScript(depConfig);
            } else {
                // Dependency not found in queue, check if it's a URL
                await loadSingleScript({ url: depId, id: depId });
            }
        });

        await Promise.all(depPromises);
    };

    const load = async (urlOrConfig: string | LoaderScriptConfig): Promise<void> => {
        const config = normalizeConfig(urlOrConfig);

        // If there are dependencies, resolve them first
        if (config.deps && config.deps.length > 0) {
            const configMap = new Map<string, LoaderScriptConfig>();
            configMap.set(getScriptId(config), config);
            await resolveDependencies(config, configMap);
        }

        return loadSingleScript(config);
    };

    const loadQueue = async (configs: LoaderScriptConfig[]): Promise<void> => {
        // Build a map of all configs by ID
        const configMap = new Map<string, LoaderScriptConfig>();
        configs.forEach((config) => {
            configMap.set(getScriptId(config), config);
        });

        // Resolve dependencies and load scripts in order
        const loadPromises: Promise<void>[] = [];

        for (const config of configs) {
            const loadPromise = (async () => {
                await resolveDependencies(config, configMap);
                await loadSingleScript(config);
            })();

            loadPromises.push(loadPromise);
        }

        await Promise.all(loadPromises);
    };

    const isLoaded = (idOrUrl: string): boolean => {
        const cached = loadedScripts.get(idOrUrl);
        return cached ? (cached.loaded === true) : false;
    };

    const getLoaded = (): string[] => {
        const loaded: string[] = [];
        loadedScripts.forEach((item, key) => {
            if (item.loaded) {
                loaded.push(key);
            }
        });
        return loaded;
    };

    const clear = (): void => {
        loadedScripts.clear();
        pendingScripts.clear();
        debugLog('Loader cache cleared');
    };

    return {
        load,
        loadQueue,
        isLoaded,
        getLoaded,
        clear,
    };
};

export default createLoader;
