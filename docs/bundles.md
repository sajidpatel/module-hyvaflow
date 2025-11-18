# Choose Your Bundle

Hyvä Flow ships two distributable bundles (plus minified variants). Pick the combination that matches your use case.

```
            ┌───────────────────────┐
            │   hyvaflow-core.js    │ ← required
            │  (event bus + APIs)   │
            └─────────┬─────────────┘
                      │
                      ▼
            Optional Plugins via
            window.hyvaflow.use()
                      │
      ┌───────────────┴──────────────┐
      │                              │
      ▼                              ▼
 hyva dom plugin              Future plugins
  (hyvaflow.js)                 (analytics, HTMX helpers, etc.)
```

### Quick Decision Checklist

1. **Only need an event bus + lifecycle hooks?** Load `hyvaflow-core.js` and install any plugins you need via `window.hyvaflow.use()`.
2. **Rely on Hyvä Flow's DOM helpers (`select`, `addDomListener`, etc.)?** Load both `hyvaflow-core.js` and `hyvaflow.js` (core first). The DOM bundle registers itself as the `dom` plugin automatically.
3. **Building a custom plugin?** Ship it as a separate script that calls `window.hyvaflow.use(pluginDefinition, options?)` once the core bundle is available.

## Core Only (`hyvaflow-core.js`)

✅ Load when you only need the event bus, lifecycle hooks, Alpine magic helper, and plugin registry.

Use this for headless integrations, analytics hooks, or projects that already have their own DOM utilities.

## Core + DOM (`hyvaflow-core.js` + `hyvaflow.js`)

✅ Load both scripts (core first) to get the full selection wrapper (`.select`, `.find`, `.closest`), DOM event delegation, and `addDomListener()` helpers.

Stick with this setup if you rely on the Hyvä Flow demos/templates or want jQuery-style helpers without introducing another library.

## Additional Plugins

Use the plugin registry to register custom modules:

```js
const analyticsPlugin = {
  name: 'analytics',
  initializer: ({ core }) => {
    core.on('hyva:cart:add', ({ detail }) => sendToAnalytics(detail));
  },
};

window.hyvaflow.use(analyticsPlugin);
```

Packaging a new plugin? Publish it as `hyvaflow-*.js` that registers itself via `window.hyvaflow.use()` (or, for backwards compatibility, `window.hyvaflow.plugins.register`) so consumers can load it after the core bundle.
