export type HyvaFlowCustomEventDetail = Record<string, any>;
export interface HyvaFlowEventDetailMap {
    'hyva:flow:boot': {
        source?: string;
    };
    'hyva:flow:ready': {
        source?: string;
    };
    'hyva:flow:dom:refresh': {
        source?: string;
    };
    'hyva:flow:demo': HyvaFlowCustomEventDetail;
    'hyva:cart:add': {
        sku: string;
        quantity: number;
        source?: string;
    };
    'hyva:cart:remove': {
        itemId?: string | number;
        sku?: string;
    };
    'hyva:drawer:cart:open': HyvaFlowCustomEventDetail;
    'hyva:drawer:cart:close': HyvaFlowCustomEventDetail;
    'hyva:menu:toggle': HyvaFlowCustomEventDetail;
}
export type HyvaFlowEventName = keyof HyvaFlowEventDetailMap;
export type HyvaFlowEventDetailFor<EventName extends string> = EventName extends HyvaFlowEventName ? HyvaFlowEventDetailMap[EventName] : HyvaFlowCustomEventDetail;
export type HyvaFlowLifecycleEventDescriptor = string | {
    event: string;
    target?: EventTarget;
};
export interface HyvaFlowLifecycleConfig {
    refreshEvents: HyvaFlowLifecycleEventDescriptor[];
    readyEvents: HyvaFlowLifecycleEventDescriptor[];
}
export interface HyvaFlowRuntimeConfig {
    lifecycle: HyvaFlowLifecycleConfig;
}
export interface HyvaFlowConfigureOptions {
    lifecycle?: Partial<HyvaFlowLifecycleConfig>;
}
