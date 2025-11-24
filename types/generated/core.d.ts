import type { HyvaFlowCustomEventDetail, HyvaFlowEventDetailMap, HyvaFlowLifecycleConfig, HyvaFlowEventName, HyvaFlowConfigureOptions, HyvaFlowRuntimeConfig, HyvaFlowServiceLoader } from './types';
export type HyvaFlowPluginContext = {
    core: HyvaFlowCore;
    window: Window;
    setInstance: (instance: any) => void;
    setConstructor: (ctor: any) => void;
};
export type HyvaFlowPluginInitializer<Options = void> = (context: HyvaFlowPluginContext, options?: Options) => void | (() => void);
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
    addEventListener<E extends HyvaFlowEventName>(eventName: E, callback: (event: CustomEvent<HyvaFlowEventDetailMap[E]>) => void): HyvaFlowCore;
    addEventListener(eventName: string, callback: EventListener): HyvaFlowCore;
    on<E extends HyvaFlowEventName>(eventName: E, callback: (event: CustomEvent<HyvaFlowEventDetailMap[E]>) => void): HyvaFlowCore;
    on(eventName: string, callback: EventListener): HyvaFlowCore;
    off(eventName: HyvaFlowEventName | string, callback?: EventListener): HyvaFlowCore;
    ns(eventName: string): string;
    debug(value?: boolean): boolean;
    use<Options = void>(definition: HyvaFlowPluginDefinition<Options>, options?: Options): HyvaFlowCore;
    plugins: HyvaFlowPluginRegistry;
    lifecycle(config?: Partial<HyvaFlowLifecycleConfig>): HyvaFlowLifecycleConfig;
    configure(options?: HyvaFlowConfigureOptions): HyvaFlowRuntimeConfig;
    serviceLoader: HyvaFlowServiceLoader;
}
export declare function createHyvaFlowCore(): HyvaFlowCore;
export declare function bootHyvaFlowCore(): void;
