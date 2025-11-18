import { StackInput } from './domHelpers';
import type { HyvaFlowCore } from './core';
import type { HyvaFlowEventInput, HyvaFlowEventPayload } from './eventBus';
import type { HyvaFlowCustomEventDetail, HyvaFlowEventDetailMap, HyvaFlowEventName } from './types';
type EventHandler = (event: Event | CustomEvent) => void;
type SelectionDispatcher = {
    <E extends HyvaFlowEventName>(event: E, detail?: HyvaFlowEventDetailMap[E]): void;
    (event: string, detail?: HyvaFlowCustomEventDetail): void;
};
type SelectionTrigger = {
    <E extends HyvaFlowEventName>(event: HyvaFlowEventInput<E> | HyvaFlowEventPayload<E>, detail?: HyvaFlowEventDetailMap[E]): void;
    (event: HyvaFlowEventInput | HyvaFlowEventPayload, detail?: HyvaFlowCustomEventDetail): void;
};
type SelectionEventSubscription = {
    <E extends HyvaFlowEventName>(eventName: E, callback: (event: CustomEvent<HyvaFlowEventDetailMap[E]>) => void): HyvaFlowSelection;
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
export type HyvaFlowFactory = (input?: StackInput) => HyvaFlowSelection;
export declare function createDomEnhancedFlow(coreFlow: HyvaFlowCore): {
    HyvaFlowConstructor: (this: HyvaFlowSelection | void, x?: StackInput) => HyvaFlowSelection;
    flowWithDom: any;
};
export {};
