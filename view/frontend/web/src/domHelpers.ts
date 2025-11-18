type DelegatedEvent = Event & {
    delegateTarget?: Element | null;
    originalEventTarget?: EventTarget | null;
};

export type DomListener = {
    eventName: string;
    selector: string;
    handler: (event: DelegatedEvent | { target: Element | null; currentTarget?: Element | null } & Record<string, any>) => void;
};

export type StackNode = Element | Document;
export type StackInput = StackNode | StackNode[] | NodeListOf<Element> | HTMLCollection | null | undefined | {
    isThis?: boolean;
    getStack?: () => StackNode[];
};

const hasDomCollections = typeof NodeList !== 'undefined' && typeof HTMLCollection !== 'undefined';
const captureEvents = new Set(['focus', 'blur']);
const selectCallbacks: Array<{ selector: string; handler: DomListener['handler'] }> = [];
const DOM_REFRESH_EVENT = 'hyva:flow:dom:refresh';

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

export function normalizeStack(input?: StackInput): StackNode[] {
    let stack: StackInput = input != null ? input : (isBrowser ? document : undefined);
    if (input && (input as any).isThis && typeof (input as any).getStack === 'function') {
        stack = (input as any).getStack();
    }
    if (!stack) {
        return [];
    }

    if (hasDomCollections && stack instanceof NodeList) {
        return Array.from(stack).filter(Boolean) as Element[];
    }
    if (hasDomCollections && stack instanceof HTMLCollection) {
        return Array.from(stack).filter(Boolean) as Element[];
    }
    if (Array.isArray(stack)) {
        return stack.filter(Boolean) as StackNode[];
    }
    if ((stack as Element).nodeType === 1 || (stack as Document).nodeType === 9) {
        return [stack as StackNode];
    }
    return [];
}

function findDelegateTarget(event: Event, selector: string): Element | null {
    if (!isBrowser) {
        return null;
    }
    const origin = event.target instanceof Element
        ? event.target
        : (event.target as Node | null)?.parentElement || null;
    if (!origin || typeof origin.closest !== 'function') {
        return null;
    }
    return origin.closest(selector);
}

function createDelegatedEvent(event: Event, match: Element): DelegatedEvent {
    const delegatedEvent: DelegatedEvent = Object.create(event);
    Object.defineProperty(delegatedEvent, 'currentTarget', {
        configurable: true,
        enumerable: false,
        value: match,
    });
    Object.defineProperty(delegatedEvent, 'target', {
        configurable: true,
        enumerable: false,
        value: match,
    });
    delegatedEvent.delegateTarget = match;
    delegatedEvent.originalEventTarget = event.target || null;
    return delegatedEvent;
}

function runSelectCallbacksFor(selector: string, handler: DomListener['handler']) {
    if (!isBrowser) {
        return;
    }
    document.querySelectorAll(selector).forEach((node) => {
        handler({
            target: node,
            currentTarget: node,
            delegateTarget: node,
        });
    });
}

function notifySelectCallbacks() {
    selectCallbacks.forEach(({ selector, handler }) => runSelectCallbacksFor(selector, handler));
}

if (isBrowser) {
    window.addEventListener(DOM_REFRESH_EVENT, () => notifySelectCallbacks());
    document.addEventListener('DOMContentLoaded', () => notifySelectCallbacks());
}

export function registerDomListener(eventName: string, selector: string, handler: DomListener['handler']) {
    if (!isBrowser || !eventName || !selector || typeof handler !== 'function') {
        return;
    }

    if (eventName === 'select') {
        selectCallbacks.push({ selector, handler });
        runSelectCallbacksFor(selector, handler);
        return;
    }

    const listener = (event: Event) => {
        const match = findDelegateTarget(event, selector);
        if (!match) {
            return;
        }
        const delegatedEvent = createDelegatedEvent(event, match);
        handler(delegatedEvent);
    };

    document.addEventListener(eventName, listener, captureEvents.has(eventName));
}
