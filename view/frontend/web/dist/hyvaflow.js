(() => {
  // view/frontend/web/src/domHelpers.ts
  var hasDomCollections = typeof NodeList !== "undefined" && typeof HTMLCollection !== "undefined";
  var captureEvents = /* @__PURE__ */ new Set(["focus", "blur"]);
  var selectCallbacks = [];
  var DOM_REFRESH_EVENT = "hyva:flow:dom:refresh";
  var isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
  function normalizeStack(input) {
    let stack = input != null ? input : isBrowser ? document : void 0;
    if (input && input.isThis && typeof input.getStack === "function") {
      stack = input.getStack();
    }
    if (!stack) {
      return [];
    }
    if (hasDomCollections && stack instanceof NodeList) {
      return Array.from(stack).filter(Boolean);
    }
    if (hasDomCollections && stack instanceof HTMLCollection) {
      return Array.from(stack).filter(Boolean);
    }
    if (Array.isArray(stack)) {
      return stack.filter(Boolean);
    }
    if (stack.nodeType === 1 || stack.nodeType === 9) {
      return [stack];
    }
    return [];
  }
  function findDelegateTarget(event, selector) {
    var _a;
    if (!isBrowser) {
      return null;
    }
    const origin = event.target instanceof Element ? event.target : ((_a = event.target) == null ? void 0 : _a.parentElement) || null;
    if (!origin || typeof origin.closest !== "function") {
      return null;
    }
    return origin.closest(selector);
  }
  function createDelegatedEvent(event, match) {
    const delegatedEvent = Object.create(event);
    Object.defineProperty(delegatedEvent, "currentTarget", {
      configurable: true,
      enumerable: false,
      value: match
    });
    Object.defineProperty(delegatedEvent, "target", {
      configurable: true,
      enumerable: false,
      value: match
    });
    delegatedEvent.delegateTarget = match;
    delegatedEvent.originalEventTarget = event.target || null;
    return delegatedEvent;
  }
  function runSelectCallbacksFor(selector, handler) {
    if (!isBrowser) {
      return;
    }
    document.querySelectorAll(selector).forEach((node) => {
      handler({
        target: node,
        currentTarget: node,
        delegateTarget: node
      });
    });
  }
  function notifySelectCallbacks() {
    selectCallbacks.forEach(({ selector, handler }) => runSelectCallbacksFor(selector, handler));
  }
  if (isBrowser) {
    window.addEventListener(DOM_REFRESH_EVENT, () => notifySelectCallbacks());
    document.addEventListener("DOMContentLoaded", () => notifySelectCallbacks());
  }
  function registerDomListener(eventName, selector, handler) {
    if (!isBrowser || !eventName || !selector || typeof handler !== "function") {
      return;
    }
    if (eventName === "select") {
      selectCallbacks.push({ selector, handler });
      runSelectCallbacksFor(selector, handler);
      return;
    }
    const listener = (event) => {
      const match = findDelegateTarget(event, selector);
      if (!match) {
        return;
      }
      const delegatedEvent = createDelegatedEvent(event, match);
      handler(delegatedEvent);
    };
    document.addEventListener(eventName, listener, captureEvents.has(eventName));
  }

  // view/frontend/web/src/hyvaflow.ts
  var selectCacheVersion = 0;
  if (typeof document !== "undefined") {
    document.addEventListener("hyva:flow:dom:refresh", () => {
      selectCacheVersion += 1;
    });
  }
  function createChildFlow(factory, value) {
    return factory(value);
  }
  function createDomEnhancedFlow(coreFlow) {
    function HyvaFlow(x) {
      if (!(this instanceof HyvaFlow)) {
        return new HyvaFlow(x);
      }
      const stack = normalizeStack(x);
      let localCacheVersion = selectCacheVersion;
      const selectCache = /* @__PURE__ */ new Map();
      const ensureFreshCache = () => {
        if (localCacheVersion !== selectCacheVersion) {
          selectCache.clear();
          localCacheVersion = selectCacheVersion;
        }
      };
      const publicApi = {
        isThis: true,
        getStack: () => stack,
        dispatchEvent: (event, detail) => {
          coreFlow.dispatchEvent(event, detail);
        },
        debug: (value) => coreFlow.debug(value),
        ns: (eventName) => coreFlow.ns(eventName),
        addDomListener: (eventName, selector, handler) => {
          registerDomListener(eventName, selector, handler);
        },
        addEventListener: (eventName, callback) => {
          if (!eventName || typeof callback !== "function") {
            return publicApi;
          }
          coreFlow.addEventListener(eventName, callback);
          return publicApi;
        },
        on: (eventName, callback) => publicApi.addEventListener(eventName, callback),
        off: (eventName, callback) => {
          coreFlow.off(eventName, callback);
          return publicApi;
        },
        trigger: (event, detail) => {
          coreFlow.trigger(event, detail);
        },
        first: () => stack[0],
        select: (selector, context) => {
          if (!selector) {
            return createChildFlow(HyvaFlow, stack);
          }
          ensureFreshCache();
          const elements = [];
          const scope = context || stack;
          const source = Array.isArray(scope) ? scope : [scope];
          const useCache = !context;
          if (useCache && selectCache.has(selector)) {
            return createChildFlow(HyvaFlow, selectCache.get(selector));
          }
          source.forEach((node) => {
            if (node && typeof node.querySelectorAll === "function") {
              elements.push(...Array.from(node.querySelectorAll(selector)));
            }
          });
          if (useCache) {
            selectCache.set(selector, elements.slice());
          }
          return createChildFlow(HyvaFlow, elements);
        },
        find: (selector, context) => {
          return publicApi.select(selector, context);
        },
        closest: (selector) => {
          if (!selector) {
            return createChildFlow(HyvaFlow, stack);
          }
          const matches = [];
          const seen = /* @__PURE__ */ new Set();
          stack.forEach((node) => {
            const element = node;
            if (element && typeof element.closest === "function") {
              const match = element.closest(selector);
              if (match && !seen.has(match)) {
                seen.add(match);
                matches.push(match);
              }
            }
          });
          return createChildFlow(HyvaFlow, matches);
        },
        hasClass: (className) => {
          if (!className) {
            return false;
          }
          return stack.some((node) => {
            const element = node;
            return element && element.classList && element.classList.contains(className);
          });
        },
        toggleClass: (className) => {
          if (!className) {
            return;
          }
          stack.forEach((node) => {
            const element = node;
            if (element && element.classList) {
              element.classList.toggle(className);
            }
          });
        },
        addClass: (className) => publicApi.apply(className, true),
        removeClass: (className) => publicApi.apply(className, false),
        apply: (className, shouldAdd) => {
          if (!className) {
            return createChildFlow(HyvaFlow, stack);
          }
          stack.forEach((node) => {
            const element = node;
            if (!element || !element.classList) {
              return;
            }
            if (shouldAdd) {
              element.classList.add(className);
            } else {
              element.classList.remove(className);
            }
          });
          return createChildFlow(HyvaFlow, stack);
        },
        set: (attr, value) => {
          if (!attr) {
            return createChildFlow(HyvaFlow, stack);
          }
          stack.forEach((node) => {
            const element = node;
            if (element && typeof element.setAttribute === "function") {
              element.setAttribute(attr, value);
            }
          });
          return createChildFlow(HyvaFlow, stack);
        },
        onEvent: (eventName, handler) => {
          if (!eventName || typeof handler !== "function") {
            return createChildFlow(HyvaFlow, stack);
          }
          stack.forEach((node) => {
            const element = node;
            if (element && typeof element.addEventListener === "function") {
              element.addEventListener(eventName, handler);
            }
          });
          return createChildFlow(HyvaFlow, stack);
        },
        each: (callback) => {
          if (typeof callback !== "function") {
            return createChildFlow(HyvaFlow, stack);
          }
          publicApi.forEach((node) => {
            callback(node);
          });
          return createChildFlow(HyvaFlow, stack);
        },
        forEach: (callback, thisArg) => {
          if (typeof callback !== "function") {
            return;
          }
          stack.forEach(callback, thisArg);
        },
        toArray: () => stack.slice()
      };
      stack.forEach((node, index) => {
        publicApi[index] = node;
      });
      Object.defineProperty(publicApi, "length", {
        configurable: true,
        enumerable: false,
        get: () => stack.length
      });
      if (typeof Symbol === "function" && Symbol.iterator) {
        Object.defineProperty(publicApi, Symbol.iterator, {
          configurable: true,
          enumerable: false,
          value: function iterator() {
            let index = 0;
            return {
              next: () => {
                if (index < stack.length) {
                  return { value: stack[index++], done: false };
                }
                return { value: void 0, done: true };
              }
            };
          }
        });
      }
      return publicApi;
    }
    const domFlow = new HyvaFlow();
    domFlow.debug = coreFlow.debug;
    Object.defineProperty(HyvaFlow, "debug", {
      configurable: true,
      enumerable: false,
      get: () => coreFlow.debug(),
      set: (value) => {
        coreFlow.debug(Boolean(value));
      }
    });
    return {
      HyvaFlowConstructor: HyvaFlow,
      flowWithDom: domFlow
    };
  }

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

  // view/frontend/web/src/index.ts
  var flow = window.hyvaflow;
  if (!flow || !flow.plugins || typeof flow.plugins.register !== "function") {
    debugLog("DOM plugin requires the core build. Load hyvaflow-core.js first.");
  } else {
    const domPlugin = {
      name: "dom",
      initializer: ({ core, setInstance, setConstructor }) => {
        const { flowWithDom, HyvaFlowConstructor } = createDomEnhancedFlow(core);
        setConstructor(HyvaFlowConstructor);
        setInstance(flowWithDom);
      }
    };
    if (typeof flow.use === "function") {
      flow.use(domPlugin);
    } else {
      flow.plugins.register(domPlugin.name, (context) => domPlugin.initializer(context));
    }
  }
  var src_default = window.hyvaflow;
  var hyvaflow = window.hyvaflow;
})();
//# sourceMappingURL=hyvaflow.js.map
