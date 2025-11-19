# Hyvä Flow Debugging Guide

Hyvä Flow ships with helpers to inspect event sequences and plugin state without sprinkling `console.log()` calls across your templates. Use this page as a quick reference when troubleshooting.

---

## Enable Debug Mode

Turn on verbose logging so the runtime announces lifecycle events, plugin registration, and other diagnostics:

```js
window.hyvaflow.debug(true);    // Instance helper
window.HyvaFlow.debug = true;   // Static setter
```

While debug is enabled you will see messages prefixed with `[HyvaFlow]`, such as plugin registration or lifecycle configuration changes. Disable it with `window.hyvaflow.debug(false)` once you finish debugging.

---

## Inspect Plugins

List registered plugins (core always registers `dom` when the DOM bundle is loaded):

```js
window.hyvaflow.plugins.list();
// ['dom']
```

Register your own plugin for custom functionality:

```js
const analyticsPlugin = {
  name: 'analytics',
  initializer: ({ core }) => {
    core.on('hyva:cart:add', ({ detail }) => sendToAnalytics(detail));
  },
};

window.hyvaflow.use(analyticsPlugin);
```

Hyvä Flow ensures each plugin is registered once and will log a debug warning if you attempt to register duplicates.

---

## Configure Lifecycle Triggers

Adjust which events emit Hyvä Flow lifecycle hooks without editing source files:

```js
window.hyvaflow.configure({
  lifecycle: {
    refreshEvents: ['htmx:afterSwap', 'custom:ajax:complete'],
    readyEvents: ['alpine:init', { event: 'theme:booted', target: document }],
  },
});
```

Call `window.hyvaflow.configure()` without arguments (or `window.hyvaflow.lifecycle()`) to inspect the current configuration. Debug logging shows when lifecycle events rebind.

Prefer the scoped lifecycle helper?

```js
window.hyvaflow.lifecycle({
  refreshEvents: ['htmx:afterSwap', 'custom:ajax:complete'],
  readyEvents: ['alpine:init', { event: 'theme:booted', target: document }],
});
```

Calling `lifecycle()` without arguments also returns the current configuration.

---

## Trace Event Sequences

Register listeners for built-in events to verify when they fire:

```js
['hyva:flow:boot', 'hyva:flow:ready', 'hyva:flow:dom:refresh'].forEach((eventName) => {
  window.hyvaflow.on(eventName, ({ detail }) => {
    console.log(`[debug] ${eventName}`, detail);
  });
});
```

Pair this with `debug(true)` to get automatic logs around plugin registration and DOM refreshes.

---

## DOM Helper Cache

The DOM plugin caches `.select()` results until `hyva:flow:dom:refresh` fires. If you suspect stale selections, trigger a refresh manually:

```js
window.hyvaflow.trigger('hyva:flow:dom:refresh');
```

This clears selection caches and replays `addDomListener('select', ...)` callbacks.

---

## Common Issues

| Symptom | Likely Cause | Fix |
| --- | --- | --- |
| `[HyvaFlow] DOM plugin requires the core build` warning | Only `hyvaflow-dom.js` loaded | Ensure `hyvaflow-core.js` is loaded before `hyvaflow-dom.js`. |
| `.select()` results seem stale after HTMX swap | Cache not invalidated | Emit `hyva:flow:dom:refresh` or call `window.hyvaflow.lifecycle()` to include your swap event. |
| Alpine components can't see `$flow` | `alpine:init` never fires | Add your own ready event via `window.hyvaflow.lifecycle({ readyEvents: ['custom:alpine:init'] })`. |
