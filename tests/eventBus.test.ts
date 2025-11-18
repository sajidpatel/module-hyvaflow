import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  pushEvent,
  triggerEvent,
  replayQueuedEvents,
  processQueue,
  registerWindowListener,
  unregisterWindowListener,
  normalizeEvent,
  ns,
  setDebugEnabled,
  debugLog,
} from '../view/frontend/web/src/eventBus';

describe('eventBus', () => {
  beforeEach(() => {
    setDebugEnabled(false);
  });

  it('normalizes string events once', () => {
    const payload = normalizeEvent('hyva:test', { foo: 'bar' });
    expect(payload).toEqual({ event: 'hyva:test', detail: { foo: 'bar' }, _hfNormalized: true });
    expect(normalizeEvent(payload!)).toBe(payload);
  });

  it('normalizes CustomEvent and Event instances', () => {
    const customPayload = normalizeEvent(new CustomEvent('demo', { detail: { hi: 1 } }));
    expect(customPayload).toEqual({ event: 'hyva:flow:demo', detail: { hi: 1 }, _hfNormalized: true });
    const nativePayload = normalizeEvent(new Event('demo')); // detail defaults to {}
    expect(nativePayload).toEqual({ event: 'hyva:flow:demo', detail: {}, _hfNormalized: true });
  });

  it('replays queued events when listeners register', () => {
    const handler = vi.fn();
    pushEvent('hyva:test', { foo: 1 });
    replayQueuedEvents('hyva:test', handler);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('registerWindowListener ignores invalid input', () => {
    registerWindowListener('', () => {});
    expect(() => triggerEvent('')).not.toThrow();
  });

  it('processes queued events only once', () => {
    const handler = vi.fn();
    registerWindowListener('hyva:test', handler);
    pushEvent('hyva:test', { foo: 2 });
    processQueue();
    processQueue();
    expect(handler).toHaveBeenCalledTimes(1);
    unregisterWindowListener('hyva:test');
  });

  it('namespaces events when using ns()', () => {
    expect(ns('demo')).toBe('hyva:flow:demo');
    expect(ns('hyva:cart:add')).toBe('hyva:cart:add');
  });

  it('respects debug toggle for debugLog', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    debugLog('off'); // default false
    expect(spy).not.toHaveBeenCalled();
    setDebugEnabled(true);
    debugLog('on');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('triggers custom events immediately', () => {
    const handler = vi.fn();
    registerWindowListener('hyva:flow:manual', handler);
    triggerEvent('hyva:flow:manual', { foo: 3 });
    expect(handler).toHaveBeenCalledTimes(1);
    unregisterWindowListener('hyva:flow:manual');
  });

  it('unregisters listeners without callback', () => {
    const handler = vi.fn();
    registerWindowListener('hyva:test:removeAll', handler);
    unregisterWindowListener('hyva:test:removeAll');
    triggerEvent('hyva:test:removeAll');
    expect(handler).not.toHaveBeenCalled();
  });

  it('unregisterWindowListener early returns when missing event', () => {
    expect(() => unregisterWindowListener('', () => {})).not.toThrow();
  });

  it('dispatches to Alpine when available', () => {
    const dispatch = vi.fn();
    (window as any).Alpine = { dispatch };
    triggerEvent('hyva:flow:demo', { foo: 'bar' });
    expect(dispatch).toHaveBeenCalledWith('hyva:flow:demo', { foo: 'bar' });
  });

  it('pushEvent returns null for invalid input', () => {
    expect(pushEvent(undefined as any)).toBeNull();
  });

  it('normalizes object payloads', () => {
    const payload = normalizeEvent({ event: 'hyva:custom', detail: { foo: 1 } });
    expect(payload).toEqual({ event: 'hyva:custom', detail: { foo: 1 }, _hfNormalized: true });
  });

  it('returns null from triggerEvent when no payload', () => {
    expect(triggerEvent(undefined as any)).toBeNull();
  });

  it('normalizes native Event instances', () => {
    const payload = normalizeEvent(new Event('hyva:flow:foo'));
    expect(payload?.event).toBe('hyva:flow:foo');
  });

  it('ignores invalid listener registrations', () => {
    const handler = vi.fn();
    registerWindowListener('', handler);
    triggerEvent('');
    expect(handler).not.toHaveBeenCalled();
  });
});
