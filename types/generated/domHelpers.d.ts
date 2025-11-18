type DelegatedEvent = Event & {
    delegateTarget?: Element | null;
    originalEventTarget?: EventTarget | null;
};
export type DomListener = {
    eventName: string;
    selector: string;
    handler: (event: DelegatedEvent | {
        target: Element | null;
        currentTarget?: Element | null;
    } & Record<string, any>) => void;
};
export type StackNode = Element | Document;
export type StackInput = StackNode | StackNode[] | NodeListOf<Element> | HTMLCollection | null | undefined | {
    isThis?: boolean;
    getStack?: () => StackNode[];
};
export declare function normalizeStack(input?: StackInput): StackNode[];
export declare function registerDomListener(eventName: string, selector: string, handler: DomListener['handler']): void;
export {};
