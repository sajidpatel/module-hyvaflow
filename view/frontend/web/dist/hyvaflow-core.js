(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };

  // view/frontend/web/src/eventBus.ts
  var FLOW_NAMESPACE = "hyva:flow";
  var HYVA_PREFIX = "hyva:";
  var globalWindow = window;
  var appEvents = globalWindow.appEvents = globalWindow.appEvents || [];
  var globalWindowListeners = globalWindow.__hyvaflowListeners = globalWindow.__hyvaflowListeners || /* @__PURE__ */ Object.create(null);
  var debugEnabled = false;
  var namespaceEventName = (eventName) => {
    if (!eventName) {
      return eventName;
    }
    if (eventName.startsWith(HYVA_PREFIX)) {
      return eventName;
    }
    return `${FLOW_NAMESPACE}:${eventName}`;
  };
  function dispatchToAlpine(eventName, detail) {
    if (window.Alpine && typeof window.Alpine.dispatch === "function") {
      window.Alpine.dispatch(eventName, detail);
    }
  }
  function normalizeEvent(event, detail) {
    if (!event) {
      return null;
    }
    if (typeof event === "object" && event._hfNormalized) {
      return event;
    }
    if (typeof event === "string") {
      return { event: namespaceEventName(event), detail: detail || {}, _hfNormalized: true };
    }
    if (event instanceof CustomEvent) {
      return { event: namespaceEventName(event.type), detail: event.detail, _hfNormalized: true };
    }
    if (event instanceof Event) {
      return { event: namespaceEventName(event.type), detail: detail || {}, _hfNormalized: true };
    }
    if (typeof event === "object" && typeof event.event === "string") {
      const payload = {
        event: namespaceEventName(event.event),
        detail: "detail" in event ? event.detail : detail || {}
      };
      payload._hfNormalized = true;
      return payload;
    }
    return null;
  }
  function rememberHandler(eventName, callback) {
    const namespacedEvent = namespaceEventName(eventName);
    if (!eventName || typeof callback !== "function") {
      return;
    }
    if (!namespacedEvent) {
      return;
    }
    if (!globalWindowListeners[namespacedEvent]) {
      globalWindowListeners[namespacedEvent] = [];
    }
    if (globalWindowListeners[namespacedEvent].indexOf(callback) === -1) {
      globalWindowListeners[namespacedEvent].push(callback);
    }
  }
  function registerWindowListener(eventName, callback) {
    if (!eventName || typeof callback !== "function") {
      return;
    }
    const namespacedEvent = namespaceEventName(eventName);
    if (!namespacedEvent) {
      return;
    }
    window.addEventListener(namespacedEvent, callback);
    rememberHandler(namespacedEvent, callback);
  }
  function unregisterWindowListener(eventName, callback) {
    const namespacedEvent = namespaceEventName(eventName);
    if (!namespacedEvent || !globalWindowListeners[namespacedEvent] || !globalWindowListeners[namespacedEvent].length) {
      return;
    }
    if (typeof callback === "function") {
      const index = globalWindowListeners[namespacedEvent].indexOf(callback);
      if (index !== -1) {
        window.removeEventListener(namespacedEvent, callback);
        globalWindowListeners[namespacedEvent].splice(index, 1);
      }
      return;
    }
    globalWindowListeners[namespacedEvent].forEach((storedHandler) => {
      window.removeEventListener(namespacedEvent, storedHandler);
    });
    globalWindowListeners[namespacedEvent] = [];
  }
  function triggerEvent(event, detail) {
    const payload = normalizeEvent(event, detail);
    if (!payload) {
      return null;
    }
    const customEvent = new CustomEvent(payload.event, { detail: payload.detail });
    window.dispatchEvent(customEvent);
    dispatchToAlpine(payload.event, payload.detail);
    return customEvent;
  }
  function pushEvent(event, detail) {
    const payload = normalizeEvent(event, detail);
    if (!payload) {
      return null;
    }
    appEvents.push(payload);
    return payload;
  }
  function replayQueuedEvents(eventName, callback) {
    if (!eventName || typeof callback !== "function") {
      return;
    }
    const namespacedEvent = namespaceEventName(eventName);
    appEvents.forEach((entry) => {
      const payload = normalizeEvent(entry);
      if (payload && payload.event === namespacedEvent) {
        callback(payload);
      }
    });
  }
  function processQueue() {
    appEvents.forEach((entry, index) => {
      const payload = normalizeEvent(entry);
      if (!payload || payload._hfProcessed) {
        return;
      }
      payload._hfProcessed = true;
      appEvents[index] = payload;
      triggerEvent(payload);
    });
  }
  appEvents.push = function push() {
    const result = Array.prototype.push.apply(this, arguments);
    processQueue();
    return result;
  };
  var ns = (eventName) => namespaceEventName(eventName);
  var setDebugEnabled = (value) => {
    debugEnabled = Boolean(value);
  };
  var isDebugEnabled = () => debugEnabled;
  var debugLog = (...args) => {
    if (debugEnabled && typeof console !== "undefined" && typeof console.log === "function") {
      console.log("[HyvaFlow]", ...args);
    }
  };

  // view/frontend/web/src/core.ts
  function createHyvaFlowCore() {
    const win = window;
    const api = {
      trigger: (event, detail) => {
        triggerEvent(event, detail);
      },
      dispatchEvent: (event, detail) => {
        pushEvent(event, detail);
      },
      addEventListener: (eventName, callback) => {
        if (!eventName || typeof callback !== "function") {
          return api;
        }
        replayQueuedEvents(eventName, callback);
        registerWindowListener(eventName, callback);
        return api;
      },
      on: (eventName, callback) => api.addEventListener(eventName, callback),
      off: (eventName, callback) => {
        unregisterWindowListener(eventName, callback);
        return api;
      },
      ns: (eventName) => ns(eventName),
      debug: (value) => {
        if (typeof value !== "undefined") {
          setDebugEnabled(Boolean(value));
          debugLog(`Debug mode ${value ? "enabled" : "disabled"}`);
        }
        return isDebugEnabled();
      },
      use: () => api,
      plugins: {
        register: () => {
        },
        isRegistered: () => false,
        list: () => []
      },
      lifecycle: () => ({
        readyEvents: [],
        refreshEvents: []
      }),
      configure: (options) => {
        if (options == null ? void 0 : options.lifecycle) {
          api.lifecycle(options.lifecycle);
        }
        return {
          lifecycle: api.lifecycle()
        };
      }
    };
    const pluginRegistry = /* @__PURE__ */ new Map();
    const assignSharedApi = (target) => {
      if (!target) {
        return;
      }
      target.plugins = api.plugins;
      target.debug = api.debug;
      target.use = api.use;
      target.lifecycle = api.lifecycle;
      target.configure = api.configure;
    };
    const pluginContextBase = {
      core: api,
      window: win,
      setInstance: (instance) => {
        if (!instance) {
          return;
        }
        assignSharedApi(instance);
        win.hyvaflow = instance;
      },
      setConstructor: (ctor) => {
        if (!ctor) {
          return;
        }
        assignSharedApi(ctor);
        win.HyvaFlow = ctor;
      }
    };
    const registerPlugin = (name, initializer) => {
      if (!name || typeof initializer !== "function") {
        debugLog("Plugin registration skipped (invalid name or initializer).");
        return;
      }
      if (pluginRegistry.has(name)) {
        debugLog(`Plugin '${name}' already registered.`);
        return;
      }
      try {
        const dispose = initializer(pluginContextBase) || void 0;
        pluginRegistry.set(name, { dispose });
        debugLog(`Plugin '${name}' registered.`);
      } catch (error) {
        debugLog(`Plugin '${name}' failed during registration.`);
        if (typeof console !== "undefined" && typeof console.error === "function") {
          console.error("[HyvaFlow] plugin error:", error);
        }
      }
    };
    const cloneOptions = (value) => {
      if (Array.isArray(value)) {
        return value.slice();
      }
      if (value && typeof value === "object") {
        return __spreadValues({}, value);
      }
      return value;
    };
    const resolvePluginOptions = (defaults, overrides) => {
      if (typeof overrides !== "undefined") {
        if (overrides && defaults && typeof overrides === "object" && typeof defaults === "object" && !Array.isArray(overrides) && !Array.isArray(defaults)) {
          return __spreadValues(__spreadValues({}, defaults), overrides);
        }
        return overrides;
      }
      return cloneOptions(defaults);
    };
    api.plugins = {
      register: registerPlugin,
      isRegistered: (name) => pluginRegistry.has(name),
      list: () => Array.from(pluginRegistry.keys())
    };
    api.use = (definition, overrides) => {
      if (!definition || !definition.name || typeof definition.initializer !== "function") {
        debugLog("Plugin registration skipped (invalid definition).");
        return api;
      }
      const pluginOptions = resolvePluginOptions(definition.defaults, overrides);
      registerPlugin(definition.name, (context) => definition.initializer(context, pluginOptions));
      return api;
    };
    assignSharedApi(api);
    win.hyvaflow = api;
    return api;
  }
  function bootHyvaFlowCore() {
    const win = window;
    if (!win.hyvaflow) {
      win.hyvaflow = createHyvaFlowCore();
    }
    if (!win.hyvaflowBooted) {
      win.hyvaflowBooted = true;
      processQueue();
      pushEvent(ns("boot"));
    }
  }

  // view/frontend/web/src/core-entry.ts
  bootHyvaFlowCore();
  var lifecycleState = {
    config: {
      refreshEvents: ["htmx:afterSwap"],
      readyEvents: ["alpine:init"]
    },
    readyListeners: [],
    refreshListeners: []
  };
  var normalizeDescriptor = (descriptor) => {
    if (typeof descriptor === "string") {
      return { event: descriptor, target: document };
    }
    const event = descriptor == null ? void 0 : descriptor.event;
    const target = descriptor == null ? void 0 : descriptor.target;
    return {
      event: event || "",
      target: target && typeof target.addEventListener === "function" ? target : document
    };
  };
  var detachListeners = (listeners) => {
    listeners.forEach(({ target, event, listener }) => target.removeEventListener(event, listener));
    listeners.length = 0;
  };
  var attachListeners = (descriptors, handler, bucket) => {
    detachListeners(bucket);
    descriptors.forEach((descriptor) => {
      const { event, target } = normalizeDescriptor(descriptor);
      if (!event) {
        return;
      }
      target.addEventListener(event, handler);
      bucket.push({ event, target, listener: handler });
    });
  };
  var handleRefresh = () => {
    pushEvent(ns("dom:refresh"));
  };
  var handleReady = () => {
    const Alpine = window.Alpine;
    if (Alpine && typeof Alpine.magic === "function") {
      Alpine.magic("flow", () => window.hyvaflow);
    }
    pushEvent(ns("ready"));
  };
  var applyLifecycleConfig = () => {
    attachListeners(lifecycleState.config.refreshEvents, handleRefresh, lifecycleState.refreshListeners);
    attachListeners(lifecycleState.config.readyEvents, handleReady, lifecycleState.readyListeners);
  };
  var updateLifecycleConfig = (config) => {
    if (config == null ? void 0 : config.refreshEvents) {
      lifecycleState.config.refreshEvents = config.refreshEvents.slice();
    }
    if (config == null ? void 0 : config.readyEvents) {
      lifecycleState.config.readyEvents = config.readyEvents.slice();
    }
    applyLifecycleConfig();
    return {
      refreshEvents: lifecycleState.config.refreshEvents.slice(),
      readyEvents: lifecycleState.config.readyEvents.slice()
    };
  };
  window.hyvaflow.lifecycle = (config) => updateLifecycleConfig(config);
  applyLifecycleConfig();
  var core_entry_default = window.hyvaflow;
  var hyvaflow = window.hyvaflow;
})();
//# sourceMappingURL=hyvaflow-core.js.map
