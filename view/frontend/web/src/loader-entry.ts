import createLoader from './loader';
import { debugLog } from './eventBus';
import type { HyvaFlowPluginDefinition } from './core';
import type { HyvaFlowLoader } from './loader';

const flow = window.hyvaflow;

if (!flow || !flow.plugins || typeof flow.plugins.register !== 'function') {
    debugLog('Loader plugin requires the core build. Load hyvaflow-core.js first.');
} else {
    const loaderPlugin: HyvaFlowPluginDefinition = {
        name: 'loader',
        initializer: ({ core, setInstance }) => {
            const loader = createLoader(core);

            // Extend the instance with loader API
            const currentInstance = window.hyvaflow;
            if (currentInstance) {
                (currentInstance as any).loader = loader;
                setInstance(currentInstance);
            }

            debugLog('Loader plugin initialized');
        },
    };

    if (typeof flow.use === 'function') {
        flow.use(loaderPlugin);
    } else {
        flow.plugins.register(loaderPlugin.name, (context) => loaderPlugin.initializer(context));
    }
}

export default window.hyvaflow;
export const hyvaflow = window.hyvaflow;
