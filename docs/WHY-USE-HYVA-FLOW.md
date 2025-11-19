# Why Use Hyvä Flow

Modern Hyvä storefronts combine Alpine.js, HTMX, inline scripts, layout XML injections, and third-party integrations. While each tool solves its own concerns, none provides a unified global runtime for event coordination, DOM lifecycle awareness, and cross-component communication.

Hyvä Flow addresses this gap by providing a predictable, global frontend layer designed specifically for Magento + Hyvä environments.

---

## 1. A Global Event Bus That Alpine.js Doesn’t Provide

Alpine is intentionally local: events only bubble through the DOM tree.  
This fails when components are unrelated, dynamically injected, or rendered in different layout regions.

Hyvä Flow introduces a consistent, namespaced global event channel:

```js
hyvaflow.trigger('hyva:cart:add', { sku });
hyvaflow.on('hyva:drawer:open', callback);
```

This enables clean, decoupled communication across the entire storefront — without custom global scripts, ad-hoc dispatchers, or brittle DOM event bubbling.

---

## 2. Automatic DOM Refresh Handling for HTMX

Hyvä storefronts increasingly rely on HTMX for partial page updates. Alpine.js has no built-in awareness of:

- HTMX swaps  
- fragment-level updates  
- deferred DOM insertions  

Hyvä Flow listens to HTMX lifecycle events and emits a guaranteed semantic event:

```
hyva:flow:dom:refresh
```

Any component or plugin can rebind itself automatically, eliminating repeated boilerplate and “Alpine stopped working after HTMX swap” bugs.

---

## 3. Predictable Global Lifecycle Events

Magento pages involve multiple async initialisation phases:

- DOMReady  
- Alpine init  
- HTMX settling  
- Lazy-loaded fragments  

Hyvä Flow standardises runtime coordination with global events:

- `hyva:flow:boot`  
- `hyva:flow:ready`  
- `hyva:flow:dom:refresh`

This provides a stable foundation for plugins, UI controllers, analytics, and integration logic.

---

## 4. Chainable DOM Utility Layer

Alpine manages state, not DOM manipulation.

Hyvä Flow introduces a minimal DOM toolkit for:

- selecting elements  
- iterating  
- attaching listeners  
- manipulating classes/attributes  
- late-binding to swapped DOM  

Example:

```js
hyvaflow.select('.product-tile')
  .addClass('loaded')
  .on('click', handler);
```

---

## 5. Decoupled UI Coordination for Complex Stores

Magento storefronts often require UI behaviours that are shared, global, or cross-component:

- cart drawer  
- mobile menu  
- global badge updates  
- modals  
- stepper progress  
- analytics tracking  

Hyvä Flow provides a thin global layer for orchestration, allowing:

- PDP triggers to update the header  
- drawer components to lock body scroll  
- analytics to hook into semantic events  
- third-party scripts to subscribe without modifying templates

---

## 6. Extensible Plugin Architecture

Hyvä Flow supports plugins that hook into:

- lifecycle events  
- DOM wrapper extensions  
- custom behaviours  
- event transforms  
- analytics pipelines  

This provides a structured way to build reusable frontend utilities — similar to Magento’s backend service contracts, but for the frontend.

---

## 7. A Unified Frontend Runtime for Magento 2

Alpine handles local component logic.  
HTMX handles partial DOM updates.  
Hyvä Flow handles:

- global events  
- DOM lifecycle  
- cross-component communication  
- predictable initialisation  
- late-bound behaviour  
- integration points for third-party tools  

---

## When You Should Use Hyvä Flow

Hyvä Flow becomes essential when your storefront needs:

- consistent global events  
- UI that affects multiple regions  
- HTMX partial rendering  
- DOM listeners that survive swaps  
- clean separation between modules  
- analytics or third-party tracking  
- predictable runtime hooks  
- an alternative to scattered inline JS blocks  

---

## Short Summary

**Alpine.js controls what happens inside components.**  
**Hyvä Flow controls what happens between components.**

It provides the missing global glue that large Hyvä storefronts need to remain stable, predictable, and scalable.
