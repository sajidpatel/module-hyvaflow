# Hyvä Flow Demo (Core + DOM Helper)

This mini demo stitches together `hyvaflow-core.js` and the optional DOM helper plugin to showcase real-world wiring. Copy the snippets into a blank Hyvä CMS block or local HTML page to experiment.

---

## 1. Load the Bundles

```html
<!-- Required: core runtime -->
<script src="/static/frontend/Vendor/theme/en_US/SajidPatel_HyvaFlow/dist/hyvaflow-core.js"></script>

<!-- Optional: DOM helper plugin (registers itself via window.hyvaflow.use) -->
<script src="/static/frontend/Vendor/theme/en_US/SajidPatel_HyvaFlow/dist/hyvaflow.js"></script>
```

Only need the event bus + lifecycle hooks? Drop the second script.

---

## 2. Markup

```html
<section class="hf-demo" data-demo>
  <header>
    <h2>Hyvä Flow Demo</h2>
    <p>Dispatch events, listen for lifecycle hooks, and highlight DOM nodes.</p>
  </header>

  <div class="hf-demo__actions">
    <button type="button" data-demo-add>Trigger hyva:cart:add</button>
    <button type="button" data-demo-ready>Emit ready</button>
    <button type="button" data-demo-refresh>Emit dom:refresh</button>
  </div>

  <div class="hf-demo__log" data-demo-log></div>

  <div class="hf-demo__cards">
    <article class="hf-card" data-demo-card="1">Card 1</article>
    <article class="hf-card" data-demo-card="2">Card 2</article>
    <article class="hf-card" data-demo-card="3">Card 3</article>
  </div>
</section>
```

Add basic CSS to emphasize `.hf-card.is-active` if desired.

---

## 3. Core Runtime Demo

```js
const logEl = document.querySelector('[data-demo-log]');
const appendLog = (message) => {
  const entry = document.createElement('div');
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logEl?.prepend(entry);
};

window.hyvaflow.on('hyva:flow:ready', () => appendLog('hyva:flow:ready fired'));
window.hyvaflow.on('hyva:cart:add', ({ detail }) => appendLog(`Cart add: ${detail.sku} x${detail.quantity}`));

document.querySelector('[data-demo-add]')?.addEventListener('click', () => {
  window.hyvaflow.trigger('hyva:cart:add', { sku: 'SKU-123', quantity: 1, source: 'demo' });
});

document.querySelector('[data-demo-ready]')?.addEventListener('click', () => {
  window.hyvaflow.trigger('hyva:flow:ready');
});

document.querySelector('[data-demo-refresh]')?.addEventListener('click', () => {
  window.hyvaflow.trigger('hyva:flow:dom:refresh', { source: 'demo button' });
});
```

This portion works with `hyvaflow-core.js` alone.

---

## 4. Optional DOM Helper Demo

Once the DOM bundle is loaded (or you manually install the DOM plugin), add richer interactions:

```js
// Optional: ensure DOM plugin is installed if you bundle manually (ES module example)
// import { createDomEnhancedFlow } from '@sajidpatel/hyvaflow/hyvaflow';

if (typeof window.hyvaflow.use === 'function' && !window.hyvaflow.plugins.isRegistered('dom')) {
  window.hyvaflow.use({
    name: 'dom',
    initializer: ({ core, setInstance, setConstructor }) => {
      const { flowWithDom, HyvaFlowConstructor } = createDomEnhancedFlow(core);
      setConstructor(HyvaFlowConstructor);
      setInstance(flowWithDom);
    },
  });
}

window.hyvaflow
  .select('[data-demo-card]')
  .addClass('is-selectable')
  .onEvent('click', (event) => {
    window.hyvaflow.select(event.currentTarget).toggleClass('is-active');
    appendLog(`Toggled card ${event.currentTarget?.dataset.demoCard}`);
  });

window.hyvaflow.addDomListener('select', '[data-demo-card]', ({ target }) => {
  appendLog(`Select callback ran for card ${target?.dataset.demoCard}`);
});
```

When `hyva:flow:dom:refresh` fires, cached selections invalidate and the `select` pseudo-event replays automatically.

---

## 5. Putting It Together

Combine the markup and scripts above for a complete playground. This mirrors the Magento template found at `view/frontend/templates/demo.phtml`, but uses plain HTML/CSS so you can run it anywhere (Storybook, CodePen, etc.). Tailor the handlers to your project to see how the core event bus and optional DOM helper complement each other.
> Already loading `hyvaflow.js` from `dist`? You can skip the manual `window.hyvaflow.use(...)` block— the script self-registers once it detects the core runtime.
