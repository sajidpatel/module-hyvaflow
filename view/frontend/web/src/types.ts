export type HyvaFlowCustomEventDetail = Record<string, any>;

export type HyvaFlowCartEventSource = 'add' | 'remove';

export interface HyvaFlowCartOption {
    code: string;
    label?: string;
    value: string | number | null;
    value_label?: string;
    swatch?: string | null;
}

export interface HyvaFlowCartAddDetail {
    sku: string;
    qty?: number;
    quantity?: number;
    parentSku?: string;
    context?: string;
    source?: string;
    options?: HyvaFlowCartOption[];
    superAttributes?: Record<string, string | number>;
}

export interface HyvaFlowCartRemoveDetail {
    itemId?: string | number;
    sku?: string;
    context?: string;
    source?: string;
}

export interface HyvaFlowCartItemSnapshot {
    id?: number;
    quantity?: number;
    product?: {
        sku?: string;
        name?: string;
        image?: {
            url?: string;
            label?: string;
        };
    };
}

export interface HyvaFlowCartSnapshot {
    id?: string;
    items?: HyvaFlowCartItemSnapshot[];
    item_count?: number;
    prices?: {
        grand_total?: {
            value?: number;
            currency?: string;
        };
    };
}

export interface HyvaFlowCartOperationEventDetail {
    cart?: HyvaFlowCartSnapshot;
    request?: HyvaFlowCartAddDetail | HyvaFlowCartRemoveDetail;
    error?: string;
    source?: HyvaFlowCartEventSource;
}

export interface HyvaFlowCartServiceConfig {
    graphqlUrl?: string;
    headers?: Record<string, string>;
    fetch?: typeof fetch;
    cartId?: string;
}

export interface HyvaFlowCartService {
    config: HyvaFlowCartServiceConfig;
    addProduct(detail: HyvaFlowCartAddDetail): Promise<HyvaFlowCartSnapshot>;
    removeItem(detail: HyvaFlowCartRemoveDetail): Promise<HyvaFlowCartSnapshot>;
    fetchCart(): Promise<HyvaFlowCartSnapshot>;
    setCartId(cartId?: string): void;
    getCartId(): string | undefined;
}

export type HyvaFlowServiceName =
    | 'cart'
    | 'category'
    | 'products'
    | 'filters'
    | 'sort'
    | 'pricingFilters'
    | 'childCategories';

export type HyvaFlowServiceTask<Service = unknown> = (service: Service) => void;



export interface HyvaFlowEventDetailMap {
    'hyva:flow:boot': { source?: string };
    'hyva:flow:ready': { source?: string };
    'hyva:flow:dom:refresh': { source?: string };
    'hyva:flow:demo': HyvaFlowCustomEventDetail;
    'hyva:cart:add': HyvaFlowCartAddDetail;
    'hyva:cart:remove': HyvaFlowCartRemoveDetail;
    'hyva:cart:add:success': HyvaFlowCartOperationEventDetail;
    'hyva:cart:add:error': HyvaFlowCartOperationEventDetail;
    'hyva:cart:remove:success': HyvaFlowCartOperationEventDetail;
    'hyva:cart:remove:error': HyvaFlowCartOperationEventDetail;
    'hyva:cart:updated': HyvaFlowCartOperationEventDetail;
    'hyva:drawer:cart:open': HyvaFlowCustomEventDetail;
    'hyva:drawer:cart:close': HyvaFlowCustomEventDetail;
    'hyva:menu:toggle': HyvaFlowCustomEventDetail;
}

export type HyvaFlowEventName = keyof HyvaFlowEventDetailMap;

export type HyvaFlowEventDetailFor<EventName extends string> = EventName extends HyvaFlowEventName
    ? HyvaFlowEventDetailMap[EventName]
    : HyvaFlowCustomEventDetail;

export type HyvaFlowLifecycleEventDescriptor = string | { event: string; target?: EventTarget };

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
