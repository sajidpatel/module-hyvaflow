import type { HyvaFlowCore, HyvaFlowPluginRegistry, HyvaFlowPluginDefinition } from './core';
import type { HyvaFlowSelection, HyvaFlowFactory } from './hyvaflow';
import type {
    HyvaFlowEventDetail,
    HyvaFlowEventInput,
    HyvaFlowEventPayload,
} from './eventBus';
import type {
    HyvaFlowCustomEventDetail,
    HyvaFlowEventDetailMap,
    HyvaFlowLifecycleConfig,
    HyvaFlowLifecycleEventDescriptor,
    HyvaFlowEventName,
    HyvaFlowRuntimeConfig,
    HyvaFlowConfigureOptions,
} from './types';

export type {
    HyvaFlowEventDetail,
    HyvaFlowEventInput,
    HyvaFlowEventPayload,
    HyvaFlowCustomEventDetail,
    HyvaFlowEventDetailMap,
    HyvaFlowEventName,
    HyvaFlowLifecycleConfig,
    HyvaFlowLifecycleEventDescriptor,
    HyvaFlowRuntimeConfig,
    HyvaFlowConfigureOptions,
    HyvaFlowPluginDefinition,
};

export interface HyvaFlowGlobal extends HyvaFlowCore, Partial<HyvaFlowSelection> {
    trigger<E extends HyvaFlowEventName>(event: E, detail?: HyvaFlowEventDetailMap[E]): void;
    trigger(event: string, detail?: HyvaFlowCustomEventDetail): void;
    on<E extends HyvaFlowEventName>(
        event: E,
        handler: (payload: CustomEvent<HyvaFlowEventDetailMap[E]>) => void,
    ): HyvaFlowGlobal;
    on(event: string, handler: EventListener): HyvaFlowGlobal;
    dispatchEvent<E extends HyvaFlowEventName>(event: E, detail?: HyvaFlowEventDetailMap[E]): void;
    dispatchEvent(event: string, detail?: HyvaFlowCustomEventDetail): void;
    lifecycle(config?: Partial<HyvaFlowLifecycleConfig>): HyvaFlowLifecycleConfig;
}

declare global {
interface Window {
    HyvaFlow?: HyvaFlowFactory & {
        plugins?: HyvaFlowPluginRegistry;
        debug?: boolean;
    };
        hyvaflow?: HyvaFlowCore | HyvaFlowGlobal;
    hyvaflowBooted?: boolean;
    Alpine?: {
        magic: (name: string, callback: () => any) => void;
        [key: string]: any;
    };
}
}
