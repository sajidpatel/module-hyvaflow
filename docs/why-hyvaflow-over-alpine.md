# 🌀 HyväFlow.js – A Unified Frontend Event & DOM Utility Layer

`HyväFlow.js` is a lightweight, dependency-free JavaScript helper designed for **Hyvä and Magento 2 storefronts**.

It provides a **global event bus**, **DOM utilities**, and **lifecycle awareness** across **Alpine.js**, **HTMX**, and **vanilla JS** — so every part of your frontend can communicate predictably without tight coupling or lost listeners.

---

## 🚀 Why HyväFlow Exists

Modern Hyvä storefronts often mix **Alpine.js**, **HTMX**, and **inline Magento scripts**.  
Each has its own lifecycle, which can lead to:

- Events lost after HTMX swaps or AJAX renders  
- Re-binding headaches across dynamic DOM updates  
- Components that can’t easily talk to each other  
- Inline scripts that depend on fragile timing (`DOMContentLoaded`, `alpine:init`, etc.)

**HyväFlow.js** solves these problems by introducing a shared foundation that ties them all together.

---

## 🧠 Core Philosophy

> **Alpine manages local state. HTMX handles partial DOM swaps.  
> HyväFlow makes the whole page behave like one system.**

---

## ✨ Key Benefits Over Alpine.js, HTMX, and Ad-Hoc Scripts

### 1. **Global, Replayable Event Bus**

Alpine can dispatch events, but only within the DOM tree.  
HyväFlow broadcasts on a **central, global bus** (`window.hyvaflow`):

```html
<button @click="$flow.trigger('hyva:cart:add', { sku, qty })">
    Add to cart
</button>
```

Hyvä Flow also exposes the same API via `window.hyvaflow`, so you can mix-and-match Alpine, vanilla JS, and third-party scripts seamlessly.

✅ Works across all components — Alpine, vanilla, or third-party  
✅ No bubbling required — global scope  
✅ Replays missed events when listeners attach later  
✅ Simplifies analytics, marketing, and UI synchronization

---

### 2. **Lifecycle Awareness**

HyväFlow listens for:

- `alpine:init`
- HTMX swaps
- `maincontent` mutations
- Custom events like `hyva:flow:boot` and `hyva:flow:dom:refresh`

This means your code automatically re-binds when:

- New HTML is injected by HTMX  
- Magento sections update  
- Alpine re-renders components  

**No more “listeners lost after AJAX reload.”**

---

### 3. **DOM Utility Toolkit**

A small jQuery-like wrapper for quick DOM operations — but native, chainable, and mutation-aware.

```js
window.hyvaflow
  .select('.promo-tile')
  .addClass('is-highlighted')
  .onEvent('click', (e) => console.log('Clicked', e.target));
```

✅ No dependencies  
✅ Works before Alpine initializes  
✅ Auto-rebinds when new nodes appear  
✅ Chainable and array-like (`each`, `toArray`, `hasClass`, `set`, `toggleClass`, etc.)

---

### 4. **HTMX-Safe and Future-Proof**

HTMX swaps often remove and replace nodes, breaking JS bindings.  
HyväFlow watches these swaps and fires lifecycle events so your listeners stay live.

```js
window.hyvaflow.on('hyva:flow:dom:refresh', () => {
  console.log('DOM reloaded after HTMX swap');
});
```

---

### 5. **Bridges Alpine, HTMX, and Plain JS**

| Task | Alpine | HTMX | HyväFlow |
|------|---------|------|-----------|
| Local reactivity | ✅ | ❌ | ⚙️ Works alongside |
| Server-driven DOM swaps | ❌ | ✅ | ⚙️ Observes swaps |
| Global event system | ⚠️ Limited | ❌ | ✅ Centralized |
| Persistent listeners | ❌ | ❌ | ✅ Auto-rebinding |
| Analytics / integration hooks | ❌ | ❌ | ✅ Seamless |

HyväFlow acts as a **neutral event layer** — Alpine and HTMX can plug in without caring about each other.

---

### 6. **No Build Step, No Framework Lock-In**

- Written in native ES5 (compatible with Magento 2’s RequireJS setup)
- Ships as a lightweight `hyvaflow-core.js` file (with an optional DOM plugin)
- Automatically loaded via `default_head_blocks.xml`
- Zero configuration — just use `window.hyvaflow`

---

### 7. **Queue & Replay Events**

HyväFlow can queue events and replay them once listeners register.  
This makes it safe for async setups (e.g., when components mount late).

```js
window.hyvaflow.dispatchEvent({ event: 'hyva:drawer:cart:open' });
```

Even if the drawer isn’t initialized yet, it will catch up when ready.

---

### 8. **Readable, Semantic Event Naming**

Follow a simple convention:

```
namespace:thing:action
```

Examples:

- `hyva:cart:add`
- `hyva:drawer:cart:open`
- `hyva:menu:toggle`
- `hyva:analytics:track`
- `hyva:flow:dom:refresh`

This creates a shared vocabulary across your JS, templates, and analytics layer.

> Hyvä Flow automatically keeps every lifecycle event inside the `hyva:flow:*` namespace and encourages all custom events to live under the `hyva:` root (e.g. `hyva:cart:add`). Use `window.hyvaflow.ns('ready')` for built-in hooks and pass fully qualified names (`hyva:cart:add`, `hyva:checkout:step`) for application-specific events.

---

## 🔍 When to Use What

| Use Case | Prefer Alpine | Prefer HyväFlow |
|-----------|---------------|-----------------|
| Local component state | ✅ |  |
| Global coordination (PDP → Header) |  | ✅ |
| DOM mutation handling |  | ✅ |
| UI toggles / modals | ✅ | ✅ (if cross-component) |
| Integrating 3rd-party scripts |  | ✅ |
| HTMX updates / async rendering |  | ✅ |

---

## 💡 Example: Add-to-Cart Flow (Unified)

```js
// PDP form
window.hyvaflow.trigger('hyva:cart:add', { sku, qty });

// Header badge
window.hyvaflow.on('hyva:cart:add', ({ detail }) => updateCartBadge(detail.qty));

// Drawer controller
window.hyvaflow.on('hyva:cart:add', () => window.hyvaflow.trigger('hyva:drawer:cart:open'));
```

✅ No direct coupling  
✅ Works across all frameworks  
✅ Resilient to partial reloads

---

## 🧩 Architecture Overview

```
window.hyvaflow
├── Event Bus (publish/subscribe)
├── DOM Delegation (event delegation + select callbacks)
├── Selection Wrapper (.select)
├── Lifecycle Hooks (boot, ready, refreshed)
├── Integration Bridges (HTMX, Alpine)
└── Plugin Registry (hyvaflow.use / plugins.register)
```

All parts work independently — you can use just the event bus, or the full utility layer.

---

## 📦 Installation

1. Copy `view/frontend/web/dist/hyvaflow-core.js` (and optionally `hyvaflow-dom.js` if you need DOM helpers) into your Hyvä child theme or module.  
2. Add to layout:
   ```xml
   <head>
     <script src="SajidPatel_HyvaFlow::dist/hyvaflow-core.js"/>
     <script src="SajidPatel_HyvaFlow::dist/hyvaflow-dom.js"/>
   </head>
   ```
3. Use anywhere in your JS or templates:
   ```js
   window.hyvaflow.trigger('ready');
   ```

---

## 🧰 API Summary

| Method | Description |
|--------|-------------|
| `trigger(event, detail?)` | Fire a CustomEvent globally |
| `on(event, handler)` | Listen to any global event |
| `off(event, handler)` | Remove a listener |
| `dispatchEvent(eventOrObject)` | Queue/replay events |
| `addDomListener(event, selector, handler)` | Bind live handlers on dynamic nodes |
| `select(selector)` | Chainable DOM wrapper |
| `each / forEach` | Iterate DOM nodes |
| `addClass / removeClass / toggleClass` | Modify classes |
| `set(attr, value)` | Set attributes |
| `onEvent(event, handler)` | Attach listeners to selection |

---

## 🧭 Example Lifecycle

```text
1️⃣ window.hyvaflow.boot()
2️⃣ Alpine fires "alpine:init" → hyva:flow:ready
3️⃣ HTMX swap → hyva:flow:dom:refresh
4️⃣ Components auto-rebind
```

---

## 🧩 Works Great With

- **Hyvä Theme**
- **HTMX fragments**
- **Alpine.js components**
- **Magento UI / RequireJS modules**
- **Third-party tracking or analytics**

---

## ✅ Summary

| Problem | Solved by HyväFlow |
|----------|-------------------|
| Lost event bindings after AJAX reload | ✅ |
| Cross-component communication | ✅ |
| Multiple frameworks not talking | ✅ |
| Need for lightweight DOM helpers | ✅ |
| No global lifecycle hooks | ✅ |
| Reusable event vocabulary | ✅ |

---

> **In one line:**  
> **HyväFlow** is the missing “frontend OS layer” that lets Alpine, HTMX, and Magento’s legacy JS speak a common language.

---

## 🧩 License

MIT © Hyvä Community
