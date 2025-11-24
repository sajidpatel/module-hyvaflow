import {
    ns,
    processQueue,
    pushEvent,
    registerWindowListener,
    replayQueuedEvents,
    triggerEvent,
    unregisterWindowListener,
    setDebugEnabled,
    isDebugEnabled,
    debugLog,
} from './eventBus';
import type {
    HyvaFlowCustomEventDetail,
    HyvaFlowEventDetailMap,
    HyvaFlowLifecycleConfig,
    HyvaFlowEventName,
    HyvaFlowConfigureOptions,
    HyvaFlowRuntimeConfig,
} from './types';


export type HyvaFlowPluginContext = {
    core: HyvaFlowCore;
    window: Window;
    setInstance: (instance: any) => void;
    setConstructor: (ctor: any) => void;
};

export type HyvaFlowPluginInitializer<Options = void> = (
    context: HyvaFlowPluginContext,
    options?: Options,
) => void | (() => void);

export type HyvaFlowPluginDefinition<Options = void> = {
    name: string;
    defaults?: Options;
    initializer: HyvaFlowPluginInitializer<Options>;
};

export type HyvaFlowPluginRegistry = {
    register: (name: string, initializer: HyvaFlowPluginInitializer) => void;
    isRegistered: (name: string) => boolean;
    list: () => string[];
};

export interface HyvaFlowCore {
    trigger<E extends HyvaFlowEventName>(event: E, detail?: HyvaFlowEventDetailMap[E]): void;
    trigger(event: string, detail?: HyvaFlowCustomEventDetail): void;
    dispatchEvent<E extends HyvaFlowEventName>(event: E, detail?: HyvaFlowEventDetailMap[E]): void;
    dispatchEvent(event: string, detail?: HyvaFlowCustomEventDetail): void;
    addEventListener<E extends HyvaFlowEventName>(
        eventName: E,
        callback: (event: CustomEvent<HyvaFlowEventDetailMap[E]>) => void,
    ): HyvaFlowCore;
    addEventListener(eventName: string, callback: EventListener): HyvaFlowCore;
    on<E extends HyvaFlowEventName>(
        eventName: E,
        callback: (event: CustomEvent<HyvaFlowEventDetailMap[E]>) => void,
    ): HyvaFlowCore;
    on(eventName: string, callback: EventListener): HyvaFlowCore;
    off(eventName: HyvaFlowEventName | string, callback?: EventListener): HyvaFlowCore;
    ns(eventName: string): string;
    debug(value?: boolean): boolean;
    use<Options = void>(definition: HyvaFlowPluginDefinition<Options>, options?: Options): HyvaFlowCore;
    plugins: HyvaFlowPluginRegistry;
    lifecycle(config?: Partial<HyvaFlowLifecycleConfig>): HyvaFlowLifecycleConfig;
    configure(options?: HyvaFlowConfigureOptions): HyvaFlowRuntimeConfig;

}

type HyvaFlowWindow = Window & {
    HyvaFlow?: any;
    hyvaflow?: HyvaFlowCore;
    hyvaflowBooted?: boolean;
};

export function createHyvaFlowCore(): HyvaFlowCore {
    const win = window as HyvaFlowWindow;
    const api: HyvaFlowCore = {
        trigger: (event, detail) => {
            triggerEvent(event as any, detail);
        },
        dispatchEvent: (event, detail) => {
            pushEvent(event as any, detail);
        },
        addEventListener: (eventName, callback) => {
            if (!eventName || typeof callback !== 'function') {
                return api;
            }
            replayQueuedEvents(eventName, callback as any);
            registerWindowListener(eventName, callback as any);
            return api;
        },
        on: (eventName, callback) => api.addEventListener(eventName, callback),
        off: (eventName, callback) => {
            unregisterWindowListener(eventName, callback);
            return api;
        },
        ns: (eventName: string) => ns(eventName),
        debug: (value?: boolean) => {
            if (typeof value !== 'undefined') {
                setDebugEnabled(Boolean(value));
                debugLog(`Debug mode ${value ? 'enabled' : 'disabled'}`);
            }
            return isDebugEnabled();
        },
        use: (() => api) as HyvaFlowCore['use'],
        plugins: {
            register: () => {},
            isRegistered: () => false,
            list: () => [],
        },
        lifecycle: () => ({
            readyEvents: [],
            refreshEvents: [],
        }),
        configure: (options) => {
            if (options?.lifecycle) {
                api.lifecycle(options.lifecycle);
            }
            return {
                lifecycle: api.lifecycle(),
            };
        },

    };

    const pluginRegistry = new Map<string, { dispose?: () => void }>();

    const assignSharedApi = (target: any) => {
        if (!target) {
            return;
        }
        target.plugins = api.plugins;
        target.debug = api.debug;
        target.use = api.use;
        target.lifecycle = api.lifecycle;
        target.configure = api.configure;

    };

    const pluginContextBase = {
        core: api,
        window: win,
        setInstance: (instance: any) => {
            if (!instance) {
                return;
            }
            assignSharedApi(instance);
            win.hyvaflow = instance;
        },
        setConstructor: (ctor: any) => {
            if (!ctor) {
                return;
            }
            assignSharedApi(ctor);
            (win as any).HyvaFlow = ctor;
        },
    };

    const registerPlugin: HyvaFlowPluginRegistry['register'] = (name, initializer) => {
        if (!name || typeof initializer !== 'function') {
            debugLog('Plugin registration skipped (invalid name or initializer).');
            return;
        }
        if (pluginRegistry.has(name)) {
            debugLog(`Plugin '${name}' already registered.`);
            return;
        }
        try {
            const dispose = initializer(pluginContextBase) || undefined;
            pluginRegistry.set(name, { dispose });
            debugLog(`Plugin '${name}' registered.`);
        } catch (error) {
            debugLog(`Plugin '${name}' failed during registration.`);
            if (typeof console !== 'undefined' && typeof console.error === 'function') {
                console.error('[HyvaFlow] plugin error:', error);
            }
        }
    };

    const cloneOptions = (value: unknown) => {
        if (Array.isArray(value)) {
            return value.slice();
        }
        if (value && typeof value === 'object') {
            return { ...(value as Record<string, unknown>) };
        }
        return value;
    };

    const resolvePluginOptions = (defaults: unknown, overrides: unknown) => {
        if (typeof overrides !== 'undefined') {
            if (
                overrides &&
                defaults &&
                typeof overrides === 'object' &&
                typeof defaults === 'object' &&
                !Array.isArray(overrides) &&
                !Array.isArray(defaults)
            ) {
                return { ...(defaults as Record<string, unknown>), ...(overrides as Record<string, unknown>) };
            }
            return overrides;
        }
        return cloneOptions(defaults);
    };

    api.plugins = {
        register: registerPlugin,
        isRegistered: (name: string) => pluginRegistry.has(name),
        list: () => Array.from(pluginRegistry.keys()),
    };

    api.use = ((definition, overrides) => {
        if (!definition || !definition.name || typeof definition.initializer !== 'function') {
            debugLog('Plugin registration skipped (invalid definition).');
            return api;
        }
        const pluginOptions = resolvePluginOptions(definition.defaults, overrides) as typeof overrides;
        registerPlugin(definition.name, (context) => definition.initializer(context, pluginOptions));
        return api;
    }) as HyvaFlowCore['use'];

    assignSharedApi(api);
    win.hyvaflow = api;

    return api;
}

export function bootHyvaFlowCore() {
    const win = window as HyvaFlowWindow;
    if (!win.hyvaflow) {
        win.hyvaflow = createHyvaFlowCore();
    }

    if (!win.hyvaflowBooted) {
        win.hyvaflowBooted = true;
        processQueue();
        pushEvent(ns('boot'));
    }
}
