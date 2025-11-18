import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHyvaFlowCore, bootHyvaFlowCore } from '../view/frontend/web/src/core';
import { createDomEnhancedFlow } from '../view/frontend/web/src/hyvaflow';

describe('core runtime', () => {
  beforeEach(() => {
    window.hyvaflow = undefined as any;
    window.HyvaFlow = undefined as any;
    window.hyvaflowBooted = false;
  });

  afterEach(() => {
    window.hyvaflow = undefined as any;
    window.HyvaFlow = undefined as any;
    window.hyvaflowBooted = false;
    bootHyvaFlowCore();
  });

  it('bootHyvaFlowCore reuses singleton and emits boot once', () => {
    const spy = vi.spyOn(window, 'dispatchEvent');
    bootHyvaFlowCore();
    const first = window.hyvaflow;
    bootHyvaFlowCore();
    expect(window.hyvaflow).toBe(first);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('exposes default lifecycle configuration', () => {
    const core = createHyvaFlowCore();
    expect(core.lifecycle()).toEqual({ readyEvents: [], refreshEvents: [] });
  });

  it('plugin registry handles invalid input and errors', () => {
    const core = createHyvaFlowCore();
    core.debug(true);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    core.plugins.register('', () => {});
    expect(logSpy).toHaveBeenCalledWith('[HyvaFlow]', 'Plugin registration skipped (invalid name or initializer).');

    const boom = new Error('boom');
    core.plugins.register('explode', () => {
      throw boom;
    });
    expect(errSpy).toHaveBeenCalledWith('[HyvaFlow] plugin error:', boom);

    const duplicateSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    core.plugins.register('dup', () => {});
    core.plugins.register('dup', () => {});
    expect(duplicateSpy).toHaveBeenCalledWith('[HyvaFlow]', "Plugin 'dup' already registered.");
    duplicateSpy.mockRestore();

    core.plugins.register('dom', ({ setInstance, setConstructor }) => {
      setInstance(undefined as any);
      setConstructor(undefined as any);
    });
    expect(core.plugins.list()).toContain('dom');
    logSpy.mockRestore();
    errSpy.mockRestore();
  });

  it('plugin context can replace instance and constructor', () => {
    const core = createHyvaFlowCore();
    const newInstance = { custom: true } as any;
    const newCtor = function Custom() {} as any;
    core.plugins.register('swap', ({ setInstance, setConstructor }) => {
      setConstructor(newCtor);
      setInstance(newInstance);
    });
    expect(window.HyvaFlow).toBe(newCtor);
    expect(window.hyvaflow).toBe(newInstance);
  });

  it('propagates debug helper to DOM selection', () => {
    const core = createHyvaFlowCore();
    core.debug(false);
    const debugSpy = vi.spyOn(core, 'debug');
    const { HyvaFlowConstructor, flowWithDom } = createDomEnhancedFlow(core);
    expect(flowWithDom.debug()).toBe(false);
    HyvaFlowConstructor.debug = true;
    expect(debugSpy).toHaveBeenCalled();
    expect(flowWithDom.debug()).toBe(true);
  });
});
