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
type WindowListenerMap = Record<string, EventListener[]>;

type HyvaFlowWindow = Window & {
    appEvents?: HyvaFlowEventPayload[];
    __hyvaflowListeners?: WindowListenerMap;
};

const FLOW_NAMESPACE = 'hyva:flow';
const HYVA_PREFIX = 'hyva:';

const globalWindow = window as HyvaFlowWindow;
const appEvents = (globalWindow.appEvents = globalWindow.appEvents || []);
const globalWindowListeners: WindowListenerMap = (globalWindow.__hyvaflowListeners =
    globalWindow.__hyvaflowListeners || Object.create(null));
let debugEnabled = false;

const namespaceEventName = (eventName?: string | null) => {
    if (!eventName) {
        return eventName;
    }
    if (eventName.startsWith(HYVA_PREFIX)) {
        return eventName;
    }
    return `${FLOW_NAMESPACE}:${eventName}`;
};

function dispatchToAlpine(eventName: string, detail: HyvaFlowEventDetail) {
    if (window.Alpine && typeof window.Alpine.dispatch === 'function') {
        window.Alpine.dispatch(eventName, detail);
    }
}

export function normalizeEvent(event?: HyvaFlowEventInput | HyvaFlowEventPayload, detail?: HyvaFlowEventDetail): HyvaFlowEventPayload | null {
    if (!event) {
        return null;
    }
    if (typeof event === 'object' && (event as HyvaFlowEventPayload)._hfNormalized) {
        return event as HyvaFlowEventPayload;
    }
    if (typeof event === 'string') {
        return { event: namespaceEventName(event) as string, detail: detail || {}, _hfNormalized: true };
    }
    if (event instanceof CustomEvent) {
        return { event: namespaceEventName(event.type) as string, detail: event.detail, _hfNormalized: true };
    }
    if (event instanceof Event) {
        return { event: namespaceEventName(event.type) as string, detail: detail || {}, _hfNormalized: true };
    }
    if (typeof event === 'object' && typeof event.event === 'string') {
        const payload = {
            event: namespaceEventName(event.event) as string,
            detail: 'detail' in event ? event.detail : detail || {},
        };
        (payload as HyvaFlowEventPayload)._hfNormalized = true;
        return payload;
    }
    return null;
}

function rememberHandler(eventName: string, callback: EventListener) {
    const namespacedEvent = namespaceEventName(eventName);
    if (!eventName || typeof callback !== 'function') {
        return;
    }
    if (!namespacedEvent) {
        return;
    }
    if (!globalWindowListeners[namespacedEvent]) {
        globalWindowListeners[namespacedEvent] = [];
    }
    if (globalWindowListeners[namespacedEvent].indexOf(callback) === -1) {
        globalWindowListeners[namespacedEvent].push(callback);
    }
}

export function registerWindowListener(eventName: string, callback: EventListener) {
    if (!eventName || typeof callback !== 'function') {
        return;
    }
    const namespacedEvent = namespaceEventName(eventName);
    if (!namespacedEvent) {
        return;
    }
    window.addEventListener(namespacedEvent, callback);
    rememberHandler(namespacedEvent, callback);
}

export function unregisterWindowListener(eventName: string, callback?: EventListener) {
    const namespacedEvent = namespaceEventName(eventName);
    if (!namespacedEvent || !globalWindowListeners[namespacedEvent] || !globalWindowListeners[namespacedEvent].length) {
        return;
    }
    if (typeof callback === 'function') {
        const index = globalWindowListeners[namespacedEvent].indexOf(callback);
        if (index !== -1) {
            window.removeEventListener(namespacedEvent, callback);
            globalWindowListeners[namespacedEvent].splice(index, 1);
        }
        return;
    }
    globalWindowListeners[namespacedEvent].forEach((storedHandler) => {
        window.removeEventListener(namespacedEvent, storedHandler);
    });
    globalWindowListeners[namespacedEvent] = [];
}

export function triggerEvent(event?: HyvaFlowEventInput | HyvaFlowEventPayload, detail?: HyvaFlowEventDetail) {
    const payload = normalizeEvent(event as HyvaFlowEventPayload, detail);
    if (!payload) {
        return null;
    }
    const customEvent = new CustomEvent(payload.event, { detail: payload.detail });
    window.dispatchEvent(customEvent);
    dispatchToAlpine(payload.event, payload.detail);
    return customEvent;
}

export function pushEvent(event: HyvaFlowEventInput, detail?: HyvaFlowEventDetail) {
    const payload = normalizeEvent(event, detail);
    if (!payload) {
        return null;
    }
    appEvents.push(payload);
    return payload;
}

export function replayQueuedEvents(eventName: string, callback: EventCallback) {
    if (!eventName || typeof callback !== 'function') {
        return;
    }
    const namespacedEvent = namespaceEventName(eventName);
    appEvents.forEach((entry) => {
        const payload = normalizeEvent(entry);
        if (payload && payload.event === namespacedEvent) {
            callback(payload);
        }
    });
}

export function processQueue() {
    appEvents.forEach((entry, index) => {
        const payload = normalizeEvent(entry);
        if (!payload || payload._hfProcessed) {
            return;
        }
        payload._hfProcessed = true;
        appEvents[index] = payload;
        triggerEvent(payload);
    });
}

appEvents.push = function push() {
    const result = Array.prototype.push.apply(this, arguments as any);
    processQueue();
    return result;
};

export const ns = (eventName: string) => namespaceEventName(eventName) as string;

export const setDebugEnabled = (value: boolean) => {
    debugEnabled = Boolean(value);
};

export const isDebugEnabled = () => debugEnabled;

export const debugLog = (...args: unknown[]) => {
    if (debugEnabled && typeof console !== 'undefined' && typeof console.log === 'function') {
        console.log('[HyvaFlow]', ...args);
    }
};
