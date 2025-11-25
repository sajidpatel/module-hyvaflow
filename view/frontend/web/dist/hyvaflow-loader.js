(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

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
  var debugLog = (...args) => {
    if (debugEnabled && typeof console !== "undefined" && typeof console.log === "function") {
      console.log("[HyvaFlow]", ...args);
    }
  };

  // view/frontend/web/src/loader.ts
  var createLoader = (core) => {
    const loadedScripts = /* @__PURE__ */ new Map();
    const pendingScripts = /* @__PURE__ */ new Map();
    const getScriptId = (urlOrConfig) => {
      if (typeof urlOrConfig === "string") {
        return urlOrConfig;
      }
      return urlOrConfig.id || urlOrConfig.url;
    };
    const normalizeConfig = (urlOrConfig) => {
      if (typeof urlOrConfig === "string") {
        return { url: urlOrConfig };
      }
      return urlOrConfig;
    };
    const createScriptElement = (config) => {
      const script = document.createElement("script");
      script.src = config.url;
      if (config.async !== false) {
        script.async = true;
      }
      if (config.defer) {
        script.defer = true;
      }
      if (config.attributes) {
        Object.entries(config.attributes).forEach(([key, value]) => {
          script.setAttribute(key, value);
        });
      }
      return script;
    };
    const loadSingleScript = (config) => {
      const scriptId = getScriptId(config);
      const cached = loadedScripts.get(scriptId);
      if (cached) {
        if (cached.error) {
          return Promise.reject(cached.error);
        }
        if (cached.loaded) {
          return Promise.resolve();
        }
      }
      const pending = pendingScripts.get(scriptId);
      if (pending) {
        return pending;
      }
      const loadPromise = new Promise((resolve, reject) => {
        const script = createScriptElement(config);
        const cleanup = () => {
          script.removeEventListener("load", onLoad);
          script.removeEventListener("error", onError);
        };
        const onLoad = () => {
          cleanup();
          debugLog(`Script loaded: ${scriptId}`);
          loadedScripts.set(scriptId, __spreadProps(__spreadValues({}, config), {
            loaded: true
          }));
          pendingScripts.delete(scriptId);
          core.trigger(core.ns("loader:complete"), {
            url: config.url,
            id: scriptId
          });
          resolve();
        };
        const onError = (error) => {
          cleanup();
          const err = new Error(`Failed to load script: ${config.url}`);
          debugLog(`Script load error: ${scriptId}`);
          loadedScripts.set(scriptId, __spreadProps(__spreadValues({}, config), {
            error: err
          }));
          pendingScripts.delete(scriptId);
          core.trigger(core.ns("loader:error"), {
            url: config.url,
            id: scriptId,
            error: err
          });
          reject(err);
        };
        script.addEventListener("load", onLoad);
        script.addEventListener("error", onError);
        core.trigger(core.ns("loader:start"), {
          url: config.url,
          id: scriptId
        });
        document.head.appendChild(script);
      });
      pendingScripts.set(scriptId, loadPromise);
      return loadPromise;
    };
    const resolveDependencies = async (config, allConfigs) => {
      if (!config.deps || config.deps.length === 0) {
        return;
      }
      const depPromises = config.deps.map(async (depId) => {
        if (isLoaded(depId)) {
          return;
        }
        const depConfig = allConfigs.get(depId);
        if (depConfig) {
          await resolveDependencies(depConfig, allConfigs);
          await loadSingleScript(depConfig);
        } else {
          await loadSingleScript({ url: depId, id: depId });
        }
      });
      await Promise.all(depPromises);
    };
    const load = async (urlOrConfig) => {
      const config = normalizeConfig(urlOrConfig);
      if (config.deps && config.deps.length > 0) {
        const configMap = /* @__PURE__ */ new Map();
        configMap.set(getScriptId(config), config);
        await resolveDependencies(config, configMap);
      }
      return loadSingleScript(config);
    };
    const loadQueue = async (configs) => {
      const configMap = /* @__PURE__ */ new Map();
      configs.forEach((config) => {
        configMap.set(getScriptId(config), config);
      });
      const loadPromises = [];
      for (const config of configs) {
        const loadPromise = (async () => {
          await resolveDependencies(config, configMap);
          await loadSingleScript(config);
        })();
        loadPromises.push(loadPromise);
      }
      await Promise.all(loadPromises);
    };
    const isLoaded = (idOrUrl) => {
      const cached = loadedScripts.get(idOrUrl);
      return cached ? cached.loaded === true : false;
    };
    const getLoaded = () => {
      const loaded = [];
      loadedScripts.forEach((item, key) => {
        if (item.loaded) {
          loaded.push(key);
        }
      });
      return loaded;
    };
    const clear = () => {
      loadedScripts.clear();
      pendingScripts.clear();
      debugLog("Loader cache cleared");
    };
    return {
      load,
      loadQueue,
      isLoaded,
      getLoaded,
      clear
    };
  };
  var loader_default = createLoader;

  // view/frontend/web/src/loader-entry.ts
  var flow = window.hyvaflow;
  if (!flow || !flow.plugins || typeof flow.plugins.register !== "function") {
    debugLog("Loader plugin requires the core build. Load hyvaflow-core.js first.");
  } else {
    const loaderPlugin = {
      name: "loader",
      initializer: ({ core, setInstance }) => {
        const loader = loader_default(core);
        const currentInstance = window.hyvaflow;
        if (currentInstance) {
          currentInstance.loader = loader;
          setInstance(currentInstance);
        }
        debugLog("Loader plugin initialized");
      }
    };
    if (typeof flow.use === "function") {
      flow.use(loaderPlugin);
    } else {
      flow.plugins.register(loaderPlugin.name, (context) => loaderPlugin.initializer(context));
    }
  }
  var loader_entry_default = window.hyvaflow;
  var hyvaflow = window.hyvaflow;
})();
//# sourceMappingURL=hyvaflow-loader.js.map
