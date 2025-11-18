# Hyvä Flow Plugin Guide

Hyvä Flow exposes a lightweight plugin API so you can ship optional modules (DOM helpers, analytics adapters, drawer controllers, etc.) without modifying the core bundle. This guide walks through the recommended patterns introduced with `window.hyvaflow.use()`.

---

## When to Reach for a Plugin

Create a plugin when you need to:

- Package optional behavior (DOM utilities, tracking hooks, integrations) that should only load when explicitly enabled.
- Replace or augment the public Hyvä Flow instance/constructor (`setInstance` / `setConstructor`).
- Share utilities across themes without adding new global variables.

If you only need to listen for events inside a single template, a standalone script may be simpler.

---

## Quick Start

Every plugin is described by a `HyvaFlowPluginDefinition` and installed via `window.hyvaflow.use()`:

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

- **name**: unique identifier (used by `plugins.list()` and duplicate detection).
- **initializer(context, options?)**: runs once, receives the core API, and may return a dispose callback.

`context` contains:

| Property | Description |
| --- | --- |
| `core` | The Hyvä Flow core instance (events, lifecycle, configure, etc.). |
| `window` | The global window (useful for attaching helpers). |
| `setInstance(instance)` | Replace the public `window.hyvaflow` object while preserving shared helpers. |
| `setConstructor(ctor)` | Replace the constructor exposed at `window.HyvaFlow`. |

Return a cleanup function if your plugin attaches listeners that should be removed when Hyvä Flow resets (optional).

---

## Passing Options / Defaults

`window.hyvaflow.use(definition, options)` merges `options` with any `definition.defaults` before invoking the initializer. Use this to expose plugin-level configuration without leaking globals:

```js
const analyticsPlugin = {
  name: 'analytics',
  defaults: {
    events: ['hyva:cart:add', 'hyva:cart:remove'],
  },
  initializer: ({ core }, options) => {
    options.events.forEach((eventName) => {
      core.on(eventName, ({ detail }) => sendToAnalytics(eventName, detail));
    });
  },
};

window.hyvaflow.use(analyticsPlugin, {
  events: ['hyva:cart:add', 'hyva:drawer:cart:open'],
});
```

Array and object defaults are shallow-cloned before they reach the initializer, so modifying the `options` object inside a plugin will not mutate the definition.

---

## Migrating from `plugins.register`

Legacy bundles may still call `window.hyvaflow.plugins.register('name', initializer)`. This continues to work, but `hyvaflow.use()` adds:

- Input validation and debug logging when definitions are missing required fields.
- Optional default options merged with overrides.
- A consistent entry point for docs/examples.

If you distribute a plugin for third parties, prefer `hyvaflow.use()` and fall back to `plugins.register` only when the method is missing (older cores).

---

## Plugin Best Practices

1. **Namespace events**: continue to emit/listen under the `hyva:` prefix (`hyva:drawer:*`, `hyva:checkout:*`, etc.).
2. **Honor lifecycle hooks**: subscribe to `hyva:flow:boot`, `hyva:flow:ready`, and `hyva:flow:dom:refresh` to coordinate DOM updates.
3. **Expose options**: provide sensible defaults via `definition.defaults` so merchants can tweak behavior without editing source.
4. **Clean up listeners**: if your plugin adds DOM or window listeners outside Hyvä Flow's helpers, return a dispose function from the initializer.
5. **Document installation**: include a snippet like `window.hyvaflow.use(myPlugin, { ... })` in your README so merchants know how to enable it.

For troubleshooting techniques, see [`docs/debugging.md`](./debugging.md); for bundle selection guidance, see [`docs/bundles.md`](./bundles.md).
