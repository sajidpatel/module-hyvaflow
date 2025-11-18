import { createDomEnhancedFlow } from './hyvaflow';
import { debugLog } from './eventBus';
import type { HyvaFlowPluginDefinition } from './core';

const flow = window.hyvaflow;

if (!flow || !flow.plugins || typeof flow.plugins.register !== 'function') {
    debugLog('DOM plugin requires the core build. Load hyvaflow-core.js first.');
} else {
    const domPlugin: HyvaFlowPluginDefinition = {
        name: 'dom',
        initializer: ({ core, setInstance, setConstructor }) => {
            const { flowWithDom, HyvaFlowConstructor } = createDomEnhancedFlow(core);
            setConstructor(HyvaFlowConstructor);
            setInstance(flowWithDom);
        },
    };

    if (typeof flow.use === 'function') {
        flow.use(domPlugin);
    } else {
        flow.plugins.register(domPlugin.name, (context) => domPlugin.initializer(context));
    }
}

export default window.hyvaflow;
export const hyvaflow = window.hyvaflow;
