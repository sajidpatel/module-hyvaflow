import { beforeAll } from 'vitest';

global.window = window;
global.document = window.document;

global.window.Alpine = {
  magic: () => {},
};

global.window.hyvaflow = undefined as any;
global.window.HyvaFlow = undefined as any;

global.window.hyvaflowBooted = false;

beforeAll(async () => {
  await import('../view/frontend/web/src/core-entry');
});
