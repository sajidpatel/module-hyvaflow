import { bootHyvaFlowCore } from './core';
import { pushEvent, ns } from './eventBus';

bootHyvaFlowCore();

type LifecycleEventDescriptor = string | { event: string; target?: EventTarget };

type LifecycleConfig = {
    refreshEvents: LifecycleEventDescriptor[];
    readyEvents: LifecycleEventDescriptor[];
};

type ActiveListener = {
    target: EventTarget;
    event: string;
    listener: EventListener;
};

const lifecycleState: {
    config: LifecycleConfig;
    readyListeners: ActiveListener[];
    refreshListeners: ActiveListener[];
} = {
    config: {
        refreshEvents: ['htmx:afterSwap'],
        readyEvents: ['alpine:init'],
    },
    readyListeners: [],
    refreshListeners: [],
};

const normalizeDescriptor = (descriptor: LifecycleEventDescriptor): { event: string; target: EventTarget } => {
    if (typeof descriptor === 'string') {
        return { event: descriptor, target: document };
    }
    const event = descriptor?.event;
    const target = descriptor?.target;
    return {
        event: event || '',
        target: target && typeof (target as EventTarget).addEventListener === 'function' ? target : document,
    };
};

const detachListeners = (listeners: ActiveListener[]) => {
    listeners.forEach(({ target, event, listener }) => target.removeEventListener(event, listener));
    listeners.length = 0;
};

const attachListeners = (descriptors: LifecycleEventDescriptor[], handler: EventListener, bucket: ActiveListener[]) => {
    detachListeners(bucket);
    descriptors.forEach((descriptor) => {
        const { event, target } = normalizeDescriptor(descriptor);
        if (!event) {
            return;
        }
        target.addEventListener(event, handler);
        bucket.push({ event, target, listener: handler });
    });
};

const handleRefresh = () => {
    pushEvent(ns('dom:refresh'));
};

const handleReady = () => {
    const Alpine = (window as any).Alpine;
    if (Alpine && typeof Alpine.magic === 'function') {
        Alpine.magic('flow', () => window.hyvaflow);
    }
    pushEvent(ns('ready'));
};

const applyLifecycleConfig = () => {
    attachListeners(lifecycleState.config.refreshEvents, handleRefresh, lifecycleState.refreshListeners);
    attachListeners(lifecycleState.config.readyEvents, handleReady, lifecycleState.readyListeners);
};

const updateLifecycleConfig = (config?: Partial<LifecycleConfig>) => {
    if (config?.refreshEvents) {
        lifecycleState.config.refreshEvents = config.refreshEvents.slice();
    }
    if (config?.readyEvents) {
        lifecycleState.config.readyEvents = config.readyEvents.slice();
    }
    applyLifecycleConfig();
    return {
        refreshEvents: lifecycleState.config.refreshEvents.slice(),
        readyEvents: lifecycleState.config.readyEvents.slice(),
    };
};

window.hyvaflow.lifecycle = (config?: Partial<LifecycleConfig>) => updateLifecycleConfig(config);
applyLifecycleConfig();

export default window.hyvaflow;
export const hyvaflow = window.hyvaflow;
export { ns } from './eventBus';
