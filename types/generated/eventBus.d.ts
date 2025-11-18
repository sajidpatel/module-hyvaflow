import type { HyvaFlowEventDetailFor } from './types';
export type HyvaFlowEventDetail<EventName extends string = string> = HyvaFlowEventDetailFor<EventName>;
export type HyvaFlowEventInput<EventName extends string = string> = EventName | Event | CustomEvent | {
    event: EventName;
    detail?: HyvaFlowEventDetail<EventName>;
};
export type HyvaFlowEventPayload<EventName extends string = string> = {
    event: EventName;
    detail: HyvaFlowEventDetail<EventName>;
    _hfProcessed?: boolean;
    _hfNormalized?: boolean;
};
type EventCallback = (payload: HyvaFlowEventPayload) => void;
export declare function normalizeEvent(event?: HyvaFlowEventInput | HyvaFlowEventPayload, detail?: HyvaFlowEventDetail): HyvaFlowEventPayload | null;
export declare function registerWindowListener(eventName: string, callback: EventListener): void;
export declare function unregisterWindowListener(eventName: string, callback?: EventListener): void;
export declare function triggerEvent(event?: HyvaFlowEventInput | HyvaFlowEventPayload, detail?: HyvaFlowEventDetail): CustomEvent<import("./types").HyvaFlowCustomEventDetail>;
export declare function pushEvent(event: HyvaFlowEventInput, detail?: HyvaFlowEventDetail): HyvaFlowEventPayload<string>;
export declare function replayQueuedEvents(eventName: string, callback: EventCallback): void;
export declare function processQueue(): void;
export declare const ns: (eventName: string) => string;
export declare const setDebugEnabled: (value: boolean) => void;
export declare const isDebugEnabled: () => boolean;
export declare const debugLog: (...args: unknown[]) => void;
export {};
