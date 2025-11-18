import { registerDomListener, StackInput, normalizeStack } from './domHelpers';
import type { HyvaFlowCore } from './core';
import type { HyvaFlowEventInput, HyvaFlowEventPayload } from './eventBus';
import type {
    HyvaFlowCustomEventDetail,
    HyvaFlowEventDetailMap,
    HyvaFlowEventName,
} from './types';

type EventHandler = (event: Event | CustomEvent) => void;
type SelectionDispatcher = {
    <E extends HyvaFlowEventName>(event: E, detail?: HyvaFlowEventDetailMap[E]): void;
    (event: string, detail?: HyvaFlowCustomEventDetail): void;
};
type SelectionTrigger = {
    <E extends HyvaFlowEventName>(
        event: HyvaFlowEventInput<E> | HyvaFlowEventPayload<E>,
        detail?: HyvaFlowEventDetailMap[E],
    ): void;
    (event: HyvaFlowEventInput | HyvaFlowEventPayload, detail?: HyvaFlowCustomEventDetail): void;
};
type SelectionEventSubscription = {
    <E extends HyvaFlowEventName>(
        eventName: E,
        callback: (event: CustomEvent<HyvaFlowEventDetailMap[E]>) => void,
    ): HyvaFlowSelection;
    (eventName: string, callback: EventHandler): HyvaFlowSelection;
};

export type HyvaFlowSelection = {
    [key: number]: Element | Document;
    length: number;
    isThis: true;
    getStack: () => (Element | Document)[];
    dispatchEvent: SelectionDispatcher;
    ns: (eventName: string) => string;
    debug: (value?: boolean) => boolean;
    addDomListener: (eventName: string, selector: string, handler: (event: Event) => void) => void;
    addEventListener: SelectionEventSubscription;
    on: SelectionEventSubscription;
    off: (eventName: HyvaFlowEventName | string, callback?: EventHandler) => HyvaFlowSelection;
    trigger: SelectionTrigger;
    first: () => Element | Document | undefined;
    select: (selector: string, context?: Element | Document | Array<Element | Document>) => HyvaFlowSelection;
    find: (selector: string, context?: Element | Document | Array<Element | Document>) => HyvaFlowSelection;
    closest: (selector: string) => HyvaFlowSelection;
    hasClass: (className: string) => boolean;
    toggleClass: (className: string) => void;
    addClass: (className: string) => HyvaFlowSelection;
    removeClass: (className: string) => HyvaFlowSelection;
    apply: (className: string, shouldAdd?: boolean) => HyvaFlowSelection;
    set: (attr: string, value: string) => HyvaFlowSelection;
    onEvent: (eventName: string, handler: EventHandler) => HyvaFlowSelection;
    each: (callback: (node: Element | Document) => void) => HyvaFlowSelection;
    forEach: (callback: (node: Element | Document, index: number, arr: (Element | Document)[]) => void, thisArg?: any) => void;
    toArray: () => (Element | Document)[];
};

let selectCacheVersion = 0;

if (typeof document !== 'undefined') {
    document.addEventListener('hyva:flow:dom:refresh', () => {
        selectCacheVersion += 1;
    });
}

export type HyvaFlowFactory = (input?: StackInput) => HyvaFlowSelection;

function createChildFlow(factory: HyvaFlowFactory, value?: StackInput): HyvaFlowSelection {
    return (factory as any)(value);
}

export function createDomEnhancedFlow(coreFlow: HyvaFlowCore) {
    function HyvaFlow(this: HyvaFlowSelection | void, x?: StackInput): HyvaFlowSelection {
        if (!(this instanceof HyvaFlow)) {
            return new (HyvaFlow as any)(x);
        }

        const stack = normalizeStack(x);
        let localCacheVersion = selectCacheVersion;
        const selectCache = new Map<string, Element[]>();

        const ensureFreshCache = () => {
            if (localCacheVersion !== selectCacheVersion) {
                selectCache.clear();
                localCacheVersion = selectCacheVersion;
            }
        };

        const publicApi: Partial<HyvaFlowSelection> = {
            isThis: true,
            getStack: () => stack,
            dispatchEvent: ((event, detail) => {
                coreFlow.dispatchEvent(event as any, detail);
            }) as HyvaFlowSelection['dispatchEvent'],
            debug: (value?: boolean) => coreFlow.debug(value),
            ns: (eventName: string) => coreFlow.ns(eventName),
            addDomListener: (eventName, selector, handler) => {
                registerDomListener(eventName, selector, handler as EventHandler);
            },
            addEventListener: ((eventName: string, callback: EventHandler) => {
                if (!eventName || typeof callback !== 'function') {
                    return publicApi as HyvaFlowSelection;
                }
                coreFlow.addEventListener(eventName, callback as any);
                return publicApi as HyvaFlowSelection;
            }) as HyvaFlowSelection['addEventListener'],
            on: ((eventName: string, callback: EventHandler) =>
                (publicApi as HyvaFlowSelection).addEventListener(eventName, callback)) as HyvaFlowSelection['on'],
            off: ((eventName, callback) => {
                coreFlow.off(eventName as any, callback);
                return publicApi as HyvaFlowSelection;
            }) as HyvaFlowSelection['off'],
            trigger: ((event, detail) => {
                coreFlow.trigger(event as any, detail);
            }) as HyvaFlowSelection['trigger'],
            first: () => stack[0],
            select: (selector, context) => {
                if (!selector) {
                    return createChildFlow(HyvaFlow, stack as any);
                }
                ensureFreshCache();
                const elements: Element[] = [];
                const scope = context || stack;
                const source = Array.isArray(scope) ? scope : [scope];
                const useCache = !context;
                if (useCache && selectCache.has(selector)) {
                    return createChildFlow(HyvaFlow, selectCache.get(selector) as unknown as StackInput);
                }
                source.forEach((node) => {
                    if (node && typeof (node as ParentNode).querySelectorAll === 'function') {
                        elements.push(...Array.from((node as ParentNode).querySelectorAll(selector) as NodeListOf<Element>));
                    }
                });
                if (useCache) {
                    selectCache.set(selector, elements.slice());
                }
                return createChildFlow(HyvaFlow, elements as unknown as StackInput);
            },
            find: (selector, context) => {
                return (publicApi as HyvaFlowSelection).select(selector, context);
            },
            closest: (selector) => {
                if (!selector) {
                    return createChildFlow(HyvaFlow, stack as any);
                }
                const matches: Element[] = [];
                const seen = new Set<Element>();
                stack.forEach((node) => {
                    const element = node as Element;
                    if (element && typeof element.closest === 'function') {
                        const match = element.closest(selector);
                        if (match && !seen.has(match)) {
                            seen.add(match);
                            matches.push(match);
                        }
                    }
                });
                return createChildFlow(HyvaFlow, matches as unknown as StackInput);
            },
            hasClass: (className) => {
                if (!className) {
                    return false;
                }
                return stack.some((node) => {
                    const element = node as Element;
                    return element && element.classList && element.classList.contains(className);
                });
            },
            toggleClass: (className) => {
                if (!className) {
                    return;
                }
                stack.forEach((node) => {
                    const element = node as Element;
                    if (element && element.classList) {
                        element.classList.toggle(className);
                    }
                });
            },
            addClass: (className) => (publicApi as HyvaFlowSelection).apply(className, true),
            removeClass: (className) => (publicApi as HyvaFlowSelection).apply(className, false),
            apply: (className, shouldAdd) => {
                if (!className) {
                    return createChildFlow(HyvaFlow, stack as any);
                }
                stack.forEach((node) => {
                    const element = node as Element;
                    if (!element || !element.classList) {
                        return;
                    }
                    if (shouldAdd) {
                        element.classList.add(className);
                    } else {
                        element.classList.remove(className);
                    }
                });
                return createChildFlow(HyvaFlow, stack as any);
            },
            set: (attr, value) => {
                if (!attr) {
                    return createChildFlow(HyvaFlow, stack as any);
                }
                stack.forEach((node) => {
                    const element = node as Element;
                    if (element && typeof element.setAttribute === 'function') {
                        element.setAttribute(attr, value);
                    }
                });
                return createChildFlow(HyvaFlow, stack as any);
            },
            onEvent: (eventName, handler) => {
                if (!eventName || typeof handler !== 'function') {
                    return createChildFlow(HyvaFlow, stack as any);
                }
                stack.forEach((node) => {
                    const element = node as Element;
                    if (element && typeof element.addEventListener === 'function') {
                        element.addEventListener(eventName, handler);
                    }
                });
                return createChildFlow(HyvaFlow, stack as any);
            },
            each: (callback) => {
                if (typeof callback !== 'function') {
                    return createChildFlow(HyvaFlow, stack as any);
                }
                (publicApi as HyvaFlowSelection).forEach((node) => {
                    callback(node);
                });
                return createChildFlow(HyvaFlow, stack as any);
            },
            forEach: (callback, thisArg) => {
                if (typeof callback !== 'function') {
                    return;
                }
                stack.forEach(callback, thisArg);
            },
            toArray: () => stack.slice(),
        };

        stack.forEach((node, index) => {
            (publicApi as HyvaFlowSelection)[index] = node;
        });

        Object.defineProperty(publicApi, 'length', {
            configurable: true,
            enumerable: false,
            get: () => stack.length,
        });

        if (typeof Symbol === 'function' && (Symbol as any).iterator) {
            Object.defineProperty(publicApi, Symbol.iterator, {
                configurable: true,
                enumerable: false,
                value: function iterator() {
                    let index = 0;
                    return {
                        next: () => {
                            if (index < stack.length) {
                                return { value: stack[index++], done: false };
                            }
                            return { value: undefined, done: true };
                        },
                    };
                },
            });
        }

        return publicApi as HyvaFlowSelection;
    }

    const domFlow = new (HyvaFlow as any)();
    (domFlow as any).debug = coreFlow.debug;

    Object.defineProperty(HyvaFlow, 'debug', {
        configurable: true,
        enumerable: false,
        get: () => coreFlow.debug(),
        set: (value: boolean) => {
            coreFlow.debug(Boolean(value));
        },
    });

    return {
        HyvaFlowConstructor: HyvaFlow,
        flowWithDom: domFlow,
    };
}
