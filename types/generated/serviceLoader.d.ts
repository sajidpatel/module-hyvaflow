import type { HyvaFlowServiceLoader, HyvaFlowServiceName, HyvaFlowServiceTask } from './types';
export declare const addHyvaFlowServiceTask: <Service = unknown>(serviceName: string, task: HyvaFlowServiceTask<Service>) => void;
export declare const registerHyvaFlowService: (serviceName: string) => void;
export declare const defaultHyvaFlowServices: HyvaFlowServiceName[];
export declare const serviceLoader: HyvaFlowServiceLoader;
export default serviceLoader;
