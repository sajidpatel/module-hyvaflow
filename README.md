# Hyvä Flow – Frontend Event & DOM Utility Layer

`hyvaflow-dom.js` is a lightweight client-side helper that gives every Hyvä (or vanilla) storefront a shared event bus and DOM utility toolkit. It replaces ad-hoc global scripts such as `sparkyJs` with a predictable API for:

1. Publishing and subscribing to global lifecycle events (page ready, HTMX swaps, Alpine dispatches, etc.).
2. Triggering cross-component actions like “add to cart”, “open cart drawer”, “show mobile menu”, or any other UI change.
3. Selecting, iterating, and mutating DOM elements with a chainable, array-like wrapper that automatically re-binds when new markup is injected.

Because Hyvä Flow attaches to `window.hyvaflow`, any script (inline template, Alpine component, HTMX target, or third-party integration) can communicate through the same channel without knowing about each other.

---

## Installation & Bootstrapping

### Via Composer (recommended)

1. Require the module:
   ```bash
   composer require sajidpatel/module-hyvaflow
   ```
2. Enable and upgrade the module:
   ```bash
   bin/magento module:enable SajidPatel_HyvaFlow
   bin/magento setup:upgrade
   ```
3. Deploy static content / clean caches as needed for your environment.

The module’s `composer.json` registers PSR-4 autoloading and copies the dist bundles into `pub/static` during `setup:static-content:deploy`.

> Using a private Git repo? Add a custom Composer repository entry before running `composer require`. In Magento’s root `composer.json`:
```json
"repositories": {
  "hyvaflow": {
    "type": "vcs",
    "url": "https://github.com/sajidpatel/module-hyvaflow.git"
  }
}
```
You can then require the package normally (Composer will fetch it from the VCS URL instead of Packagist).

### Manual drop-in (legacy)

Hyvä Flow ships as two ES module bundles stored in `view/frontend/web/dist`:

- `hyvaflow-core.js` – required event-bus runtime (always include this). Minified version: `hyvaflow-core.min.js`.
- `hyvaflow-dom.js` – optional DOM helper plugin (selection API, `.apply`, `.set`, `.addDomListener`, etc.). Minified version: `hyvaflow-dom.min.js`.

The default layout XML (`view/frontend/layout/default_head_blocks.xml`) loads both scripts so existing templates keep working. To run a “bus only” setup, include just `hyvaflow-core.js`.

Once the script is on the page, it:

- Exposes a global constructor (`window.HyvaFlow`) and a singleton (`window.hyvaflow = new HyvaFlow()`).
- Registers lifecycle hooks:
  - `hyva:flow:ready` when `alpine:init` fires.
  - `hyva:flow:dom:refresh` when HTMX swaps or `maincontent` mutates.
  - `hyva:flow:boot` on first load.
- Provides helpers on the singleton and on any chainable selection (see “API summary” below).
- Automatically namespaces every CustomEvent with the `hyva:` root (Hyvä Flow lifecycle hooks live under `hyva:flow:*`). Call `window.hyvaflow.ns('ready')` to produce `hyva:flow:ready`, or pass a fully qualified name like `hyva:cart:add` and it will be dispatched verbatim.

The readable and minified bundles are generated via [esbuild](https://esbuild.github.io/) from the modular sources stored under `view/frontend/web/src`:

- `eventBus.ts` – global queue, trigger, and Alpine/HTMX integrations.
- `domHelpers.ts` – DOM listener registry and rebind helpers.
- `hyvaflow.ts` – the chainable DOM API + public singleton factory.
- `docs/bundles.md` – overview of which bundles to load (core only vs. core + DOM).
- `docs/debugging.md` – tips for enabling debug mode, configuring lifecycle events, and inspecting plugins.
- `index.ts` – bootstraps the globals and wires document-level listeners.

Run `npm run build` inside `app/code/SajidPatel/HyvaFlow` whenever you change the source files.

### Developing & Bundling

```
cd app/code/SajidPatel/HyvaFlow
npm install        # once
npm run build      # compile once (includes type generation + bundling)
npm run watch      # optional: rebuild on change
npm run typecheck  # optional: static type checking via tsc --noEmit
npm run lint       # optional: ESLint over view/frontend/web/src
```

The bundler emits ES5-compatible IIFEs that keep the global API (`window.HyvaFlow` / `window.hyvaflow`) intact, so Magento can continue loading `dist/hyvaflow-core.js` (and optionally `dist/hyvaflow-dom.js`) with classic `<script>` tags while you author modern modules under `view/frontend/web/src`.

### Event Namespaces & Helper

Every Hyvä Flow event should live in the `hyva:` root namespace. Lifecycle hooks use the `hyva:flow:*` channel, but you can emit your own events such as `hyva:cart:add` or `hyva:checkout:step`.

Use the helper exposed on the singleton to build namespaced strings:

```js
const ns = window.hyvaflow.ns;

window.hyvaflow.trigger(ns('ready'));          // => hyva:flow:ready
window.hyvaflow.on(ns('dom:refresh'), handler);

window.hyvaflow.trigger('hyva:cart:add', { sku, qty });
window.hyvaflow.on('hyva:cart:add', ({ detail }) => track(detail));
```

Selections cache `.select()` results per-instance to avoid repeated DOM queries; the cache flushes automatically whenever `hyva:flow:dom:refresh` fires so you never work with stale nodes. Use `.find()` as a semantic alias for `.select()` and `.closest()` to walk up the DOM without extra boilerplate.

### Debug Mode

Need to see what Hyvä Flow is doing under the hood? Enable debug logging globally:

```js
window.hyvaflow.debug(true);    // instance helper
// or
window.HyvaFlow.debug = true;   // static setter
```

Once enabled, Hyvä Flow prints diagnostic messages (missing core/plugin, event lifecycle hints, etc.) prefixed with `[HyvaFlow]`. Toggle it off with `window.hyvaflow.debug(false)`.

### Plugin Registry

Use `window.hyvaflow.use()` when you want to activate an optional module (DOM helpers, analytics adapters, drawer controllers) without modifying the core bundle:

```js
const domPlugin = {
  name: 'dom',
  initializer: ({ core, setInstance, setConstructor }) => {
    const { flowWithDom, HyvaFlowConstructor } = createDomEnhancedFlow(core);
    setConstructor(HyvaFlowConstructor);
    setInstance(flowWithDom);
  },
};

window.hyvaflow.use(domPlugin);
```

Each plugin initializer runs once, receives the core API, and can replace the public instance/constructor via the supplied setters. Provide optional `defaults` on a plugin definition and pass overrides to `window.hyvaflow.use(plugin, options)` when installing. Use plugins for optional modules like DOM helpers, analytics bridges, HTMX adapters, etc. The low-level `window.hyvaflow.plugins.register()` call still works for advanced scenarios, but `hyvaflow.use()` is the recommended facade. List registered plugins with `window.hyvaflow.plugins.list()`. See [`docs/plugins.md`](./docs/plugins.md) for more patterns, option merging tips, and migration guidance.

### Lifecycle Configuration

By default Hyvä Flow listens for `htmx:afterSwap` to emit `hyva:flow:dom:refresh` and `alpine:init` to emit `hyva:flow:ready`. Override or extend these triggers without editing the source:

```js
window.hyvaflow.configure({
  lifecycle: {
    refreshEvents: ['htmx:afterSwap', 'custom:ajax:complete'],
    readyEvents: ['alpine:init', { event: 'theme:booted', target: document }],
  },
});
```

The legacy `window.hyvaflow.lifecycle()` helper still works, but `configure()` lets you update multiple runtime concerns at once and always returns the active configuration so you can confirm what’s live. Calling `configure()` without arguments returns the current settings.

If you only need to adjust lifecycle hooks you can continue to call `window.hyvaflow.lifecycle()` directly:

```js
window.hyvaflow.lifecycle({
  refreshEvents: ['htmx:afterSwap', 'custom:ajax:complete'],
  readyEvents: ['alpine:init', { event: 'theme:booted', target: document }],
});
```

Each descriptor can be a plain event name (defaults to `document`) or an object with a custom `target`.

### Dev Tooling

This package ships with a few npm scripts to keep types, linting, and tests in sync:

| Command | Description |
| --- | --- |
| `npm run typecheck` | Executes `tsc --noEmit` against `tsconfig.json` to catch regressions in CI (fast—typically <1s). |
| `npm run lint` / `npm run lint:fix` | Runs ESLint on `view/frontend/web/src/**/*.ts` (expect a few seconds; use `lint:fix` to apply safe fixes). |
| `npm run test` / `npm run test:watch` | Launches the Vitest suite once or in watch mode (complete run finishes in under 5s on a typical laptop). |
| `npm run build:types` | Emits `.d.ts` files into `types/generated` via `tsc -p tsconfig.types.json` (about a second for the current codebase). |
| `npm run types:watch` | Watches source files and continuously refreshes declaration output for iterative work. |

Run `npm run build` to build the declaration files and ES module bundle in a single step before committing.

### Further Reading

- [`docs/why-hyvaflow-over-alpine.md`](./docs/why-hyvaflow-over-alpine.md) – Why HyvaFlow over Alpine JS
- [`docs/bundles.md`](./docs/bundles.md) – core vs. core+DOM decision tree and bundle selection tips.
- [`docs/demo.md`](./docs/demo.md) – copy/paste playground showcasing the core runtime and optional DOM helper.
- [`docs/plugins.md`](./docs/plugins.md) – full plugin guide covering options, defaults, and cleanup.
- [`docs/debugging.md`](./docs/debugging.md) – enabling debug logs, inspecting lifecycle hooks, and tracing events.

---

## API Summary

| Method | Description |
| --- | --- |
| [`window.hyvaflow.trigger(eventName, detail?)`](./docs/debugging.md#trace-event-sequences) | Dispatches a CustomEvent on `window` and forwards the payload to Alpine via `Alpine.dispatch` if available. |
| [`window.hyvaflow.dispatchEvent(eventOrObject)`](./docs/plugins.md#when-to-reach-for-a-plugin) | Queues an event (string, Event, CustomEvent, or `{event, detail}` object) that replays when listeners register. |
| [`window.hyvaflow.on(eventName, handler)` / `addEventListener` / `off`](./docs/debugging.md#trace-event-sequences) | Subscribe/unsubscribe to global events. Queued events are replayed immediately when listeners attach. |
| [`window.hyvaflow.addDomListener(eventName, selector, handler)`](./docs/bundles.md#core--dom-hyvaflow-corejs--hyvaflowjs) | Delegates events at the document level so dynamically inserted nodes respond without rebinding. Includes a `select` pseudo-event that fires for each matching node on registration and whenever `hyva:flow:dom:refresh` is emitted. |
| [`window.hyvaflow.ns(eventName)`](./docs/debugging.md#configure-lifecycle-triggers) | Returns a namespaced string (e.g., `hyva:flow:ready`). Handy when exporting helpers or wiring Alpine/HTMX bridges. |
| [`window.hyvaflow.select(selectorOrElements)`](./docs/bundles.md#core--dom-hyvaflow-corejs--hyvaflowjs) | Returns a chainable wrapper (array-like) around DOM nodes. Methods include `first`, `find`, `closest`, `each`, `forEach`, `toArray`, `hasClass`, `toggleClass`, `addClass`, `removeClass`, `apply`, `set`, and `onEvent`. Chaining returns a new `HyvaFlow` instance so you can continue calling helpers. |

The global object and all chained selections also expose these utility methods, so `window.hyvaflow.select('.product')` gets you a chainable cursor, while `window.hyvaflow.trigger(...)` interacts with the global event bus.

---

## Typical Use Cases

### 1. Trigger “Add to Cart” Events

Use a single event to notify every component (cart badge, analytics, marketing banners, etc.) that a product was added:

```js
// Somewhere inside your product card or PDP form handler
const payload = {
  event: 'hyva:cart:add',
  sku: productSku,
  quantity: qty,
  source: 'pdp'
};

window.hyvaflow.trigger('hyva:cart:add', payload);
```

Then, anywhere else on the page:

```js
const badge = document.querySelector('[data-cart-count]');

const updateCartBadge = (event) => {
  const { quantity } = event.detail;
  const current = Number(badge.textContent) || 0;
  badge.textContent = current + quantity;
};

window.hyvaflow.on('hyva:cart:add', updateCartBadge);
```

You can also pipe the same event to analytics:

```js
window.hyvaflow.on('hyva:cart:add', ({ detail }) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'add_to_cart', ...detail });
});
```

### 2. Show / Hide Cart Drawer

Keep cart UI pieces decoupled by emitting semantic events rather than calling drawer APIs directly:

```js
// Open drawer after a successful add-to-cart AJAX call
window.hyvaflow.trigger('hyva:drawer:cart:open');

// Somewhere in the drawer controller:
window.hyvaflow.on('hyva:drawer:cart:open', () => cartDrawer.open());
window.hyvaflow.on('hyva:drawer:cart:close', () => cartDrawer.close());
```

### 3. Toggle Mobile Menu or Any Overlay

Forward button clicks into a named event so any overlay (menu, filters, modals) can react consistently:

```js
const toggleMenuButton = document.getElementById('menu-toggle');
toggleMenuButton.addEventListener('click', () => {
  window.hyvaflow.trigger('hyva:menu:toggle');
});

window.hyvaflow.on('hyva:menu:toggle', () => {
  document.documentElement.classList.toggle('menu-open');
});
```

### 4. Use DOM Utilities to Highlight Dynamic Content

Lean on the selection wrapper when you need to batch DOM operations without writing repetitive loops:

```js
// Highlight all promotional tiles
window.hyvaflow
  .select('.promo-tile')
  .addClass('is-highlighted')
  .set('data-highlighted', 'true')
  .onEvent('click', (event) => console.log('Clicked', event.currentTarget));
```

Because the selection wrapper is array-like, you can still access nodes directly:

```js
const firstTile = window.hyvaflow.select('.promo-tile')[0];
```

### 5. Bind to Dynamically Injected Nodes

Delegate listeners through `addDomListener` so HTMX/Alpine insertions automatically inherit behavior:

```js
window.hyvaflow.addDomListener('click', '.mini-cart-item .remove', (event) => {
  const itemId = event.target.closest('[data-item-id]')?.dataset.itemId;
  if (itemId) {
window.hyvaflow.trigger('hyva:cart:remove', { itemId });
  }
});
```

Even if `.mini-cart-item` elements are loaded via HTMX or rendered by Alpine, the listener is reattached automatically.

---

## Putting It Together: Add-to-Cart Flow

1. The PDP form submits via fetch, then calls `window.hyvaflow.trigger('hyva:cart:add', detail)`.
2. The header cart badge listens for `hyva:cart:add` and animates the count.
3. The cart drawer listens for the same event to open itself (`window.hyvaflow.on('hyva:cart:add', () => window.hyvaflow.trigger('hyva:drawer:cart:open'))`).
4. Marketing banners listen for `hyva:cart:add` and `hyva:cart:remove` to show thresholds (“Spend $X more for free shipping”).
5. Analytics taps into the same events without touching UI components.

All of this wiring happens through one event bus (Hyvä Flow) instead of direct DOM lookups or cross-module imports.

---

## When to Prefer Alpine

Hyvä Flow doesn’t replace Alpine—it complements it. Use Alpine for component state, templating, and reactivity; rely on Hyvä Flow when you need:

- Cross-component signals (e.g., PDP → header, modal → body scroll lock).
- A thin pub/sub layer that third-party scripts can hook into without Alpine knowledge.
- DOM utilities that work before Alpine initializes or outside of Alpine-managed regions.

If a given widget is already an Alpine component and you only need local state, Alpine is a fine choice. For global coordination and late-bound DOM listeners, Hyvä Flow keeps the surface consistent.

---

## Resources

- `/view/frontend/web/dist/hyvaflow-core.js` – readable event-bus bundle (minified `/view/frontend/web/dist/hyvaflow-core.min.js` is also available).
- `/view/frontend/web/dist/hyvaflow-dom.js` – optional DOM helper plugin (minified `/view/frontend/web/dist/hyvaflow-dom.min.js` is also available).
- `/view/frontend/web/src/` – modular source files (`eventBus.ts`, `domHelpers.ts`, `hyvaflow.ts`, `index.ts`).
- `/view/frontend/templates/demo.phtml` – interactive playground that exercises every API method.
- `/view/frontend/templates/examples2.phtml` – examples of global event bus usage (search bus, cart/wishlist cross-component events).

Feel free to extend the event naming conventions (`namespace:thing:action`) to match your project. Because everything is plain JS events, you can plug in analytics, modals, drawers, and custom scripts without tight coupling.
Hyvä Flow automatically registers an Alpine magic helper inside `alpine:init`, so every component can call the bus via `$flow`:

```html
<button @click="$flow.trigger('hyva:cart:add', { sku: 'SKU', qty: 1 })">
    Add to cart
</button>
```
