# Why Use Hyvä Flow (Core + DOM)

## What if you could...

Have one unified layer beneath Alpine.js, HTMX, vanilla JS, Magento
inline scripts, and third-party widgets that provides:

-   A namespaced global event bus
-   A DOM utility wrapper (jQuery-like, zero overhead)
-   Guaranteed event delivery without race conditions
-   Auto-rebinding DOM listeners after HTMX swaps
-   Delegated event handling that never breaks
-   Automatic cache invalidation for DOM selections
-   One lifecycle shared by ALL components
-   Late listeners still receiving early events (queue + replay)

What if every component --- Alpine or not --- always knew **when the DOM
is ready**, **when it refreshed**, and **how to communicate globally**?

------------------------------------------------------------------------

## So that...

Your storefront becomes **deterministic and stable**, even in dynamic
Magento/Hyvä environments.

### No more race conditions

-   Events fired before Alpine is ready → Delivered anyway
-   HTMX swaps replacing DOM nodes → Events replayed + listeners
    rebound
-   Components initialised out of order → Still receive all events
    correctly

### No more fragile DOM listeners

HyväFlow DOM ensures: - Delegated events always reach correct targets
- Listeners auto-rebind after refresh
- `select()` callbacks re-run when new nodes appear
- Cache invalidation prevents stale DOM references

### No more "DOM wasn't ready" bugs

Hyvä Flow handles: - `DOMContentLoaded` - `alpine:init` -
`htmx:afterSwap` - `hyva:flow:dom:refresh`

Consistently.

------------------------------------------------------------------------

## For example...

### Example 1: Mini-cart breaks after HTMX swap

**Before:**
HTMX replaces the mini-cart → old listeners lost → buttons stop working.

**With Hyvä Flow:**
`hyva:flow:dom:refresh` fires → DOM listeners rebind automatically →
mini-cart always works.

------------------------------------------------------------------------

### Example 2: Alpine hydrates late

**Before:**
Event dispatched before Alpine ready → lost.

**With Hyvä Flow Core:**
Event is queued → replayed when Alpine loads → nothing is lost.

------------------------------------------------------------------------

### Example 3: Delegated events that never miss

``` js
flow.addDomListener('click', '.product-item', (e) => {
  e.currentTarget.classList.add('active')
})
```

Hyvä Flow guarantees: - Correct target
- No double-handlers
- Works after DOM changes

------------------------------------------------------------------------

## And that's not all...

### 1. jQuery-like DOM API

    flow('.item').addClass('active').set('aria-expanded', true)

Chainable, array-like, iterable.

------------------------------------------------------------------------

### 2. A unified lifecycle layer

Normalised events:

    hyva:flow:ready
    hyva:flow:dom:refresh

------------------------------------------------------------------------

### 3. Plugin Architecture

Use `flow.use()` to register plugins with shared context:

    { core, window, setInstance, setConstructor }

------------------------------------------------------------------------

### 4. Zero naming collisions

All events namespaced:

    hyva:flow:{event}

------------------------------------------------------------------------

### 5. Alpine integration done right

Hyvä Flow injects:

    Alpine.magic('flow', () => window.hyvaflow)

So you can:

``` html
<button @click="$flow.trigger('cart:add', { id: 10 })">
```

------------------------------------------------------------------------

# Why Hyvä Flow vs Alpine vs HTMX vs jQuery

A high‑level comparison of the four approaches:

  ---------------------------------------------------------------------------------------
  Feature / Concern **Hyvä Flow**         **Alpine.js**    **HTMX**        **jQuery**
  ----------------- --------------------- ---------------- --------------- --------------
  **Global Event    ✅ Fully namespaced,  ⚠️               ❌ No global    ❌ Manual,
  Bus**             replayable, no race   Dispatch-only,   coherent bus    unstructured
                    conditions            no queue, no
                                          replay

  **DOM Refresh     ✅ Auto-detects HTMX  ❌ Must manually ⚠️ Triggers     ❌ Must rebind
  Handling**        swaps + rebinds       re-init          events but no   manually
                                                           rebinding logic

  **Late Listener   ✅ Events queued +    ❌ Missed events ⚠️ Depends on   ❌ Must
  Support**         replayed                               server triggers manually track

  **Delegated       ✅ Native wrapper     ⚠️ Limited       ❌ Not provided ⚠️ Yes, but
  Events**          with correct                                           manual
                    `currentTarget`

  **Select()        ✅ Cached +           ❌ No            ❌ No           ❌ Re-query
  Caching**         auto-invalidates on   abstraction      abstraction     every time
                    refresh

  **Lifecycle       ✅                    ⚠️ Alpine-only   ⚠️ HTMX-only    ❌ None
  Normalisation**   `DOMContentLoaded`,
                    `alpine:init`, HTMX
                    swaps unified

  **DOM Utilities** ✅ jQuery-like:       ❌ No DOM API    ❌ No DOM API   ✅ But heavy
                    `addClass`, `set`,
                    `closest`, `each`

  **Plugin          ✅ Built-in           ⚠️ Limited       ❌ None         ❌ None
  Architecture**

  **Ideal Use       Hyvä/Magento unified  Component        Server-driven   DOM
  Case**            runtime               behaviour        partial updates manipulation
  ---------------------------------------------------------------------------------------

### Summary

-   **Alpine = behaviour**
-   **HTMX = HTML over the wire**
-   **jQuery = DOM manipulation**
-   **Hyvä Flow = the coordination layer for ALL of them**

Hyvä Flow fills the missing gap: **a deterministic event + DOM +
lifecycle layer**.

------------------------------------------------------------------------

## Hyvä Flow = Stability + Determinism + Developer Happiness

A unified core + DOM layer for predictable, race-free, component-safe
behaviour across any Magento/Hyvä storefront.