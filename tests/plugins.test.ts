import { describe, it, expect, vi } from 'vitest';
import { createHyvaFlowCore } from '../view/frontend/web/src/core';

describe('plugin registry', () => {
  it('registers plugins once', () => {
    const core = createHyvaFlowCore();
    const init = vi.fn();
    core.plugins.register('test', init);
    core.plugins.register('test', init);
    expect(core.plugins.list()).toContain('test');
    expect(init).toHaveBeenCalledTimes(1);
  });

  it('installs plugins through the use facade', () => {
    const core = createHyvaFlowCore();
    const initializer = vi.fn();
    core.use({ name: 'facade', initializer });
    expect(core.plugins.list()).toContain('facade');
    expect(initializer).toHaveBeenCalledTimes(1);
  });

  it('merges default options with overrides when using use()', () => {
    const core = createHyvaFlowCore();
    const initializer = vi.fn();
    core.use(
      {
        name: 'configured',
        defaults: { foo: 1, bar: 2 },
        initializer: (_context, options) => initializer(options),
      },
      { foo: 3 },
    );
    expect(initializer).toHaveBeenCalledWith({ foo: 3, bar: 2 });
  });
});
