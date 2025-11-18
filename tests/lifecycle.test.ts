import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('lifecycle configuration', () => {
  beforeEach(() => {
    window.Alpine.magic = vi.fn(() => {});
  });

  it('returns default lifecycle config', () => {
    const config = window.hyvaflow.lifecycle();
    expect(config.refreshEvents).toContain('htmx:afterSwap');
    expect(config.readyEvents).toContain('alpine:init');
  });

  it('applies custom lifecycle events and fires ready', () => {
    const handler = vi.fn();
    window.hyvaflow.on('hyva:flow:ready', handler);
    const config = window.hyvaflow.lifecycle({ readyEvents: ['custom:ready'] });
    expect(config.readyEvents).toEqual(['custom:ready']);
    document.dispatchEvent(new Event('custom:ready'));
    expect(handler).toHaveBeenCalled();
    expect(window.Alpine.magic).toHaveBeenCalled();
  });

  it('updates refresh events and ignores descriptors without event', () => {
    const handler = vi.fn();
    window.hyvaflow.on('hyva:flow:dom:refresh', handler);
    const config = window.hyvaflow.lifecycle({ refreshEvents: ['custom:refresh', { target: {} as EventTarget }] });
    expect(config.refreshEvents.length).toBe(2);
    document.dispatchEvent(new Event('custom:refresh'));
    expect(handler).toHaveBeenCalled();
  });

  it('falls back to document when target lacks addEventListener', () => {
    const handler = vi.fn();
    window.hyvaflow.on('hyva:flow:dom:refresh', handler);
    window.hyvaflow.lifecycle({ refreshEvents: [{ event: 'custom:refresh-2', target: {} as EventTarget }] });
    document.dispatchEvent(new Event('custom:refresh-2'));
    expect(handler).toHaveBeenCalled();
  });

  it('invokes Alpine magic on default ready event', () => {
    const magicSpy = vi.spyOn(window.Alpine, 'magic');
    window.hyvaflow.lifecycle({ readyEvents: ['alpine:init'] });
    document.dispatchEvent(new Event('alpine:init'));
    expect(magicSpy).toHaveBeenCalled();
  });

  it('configures lifecycle via configure()', () => {
    const response = window.hyvaflow.configure({ lifecycle: { readyEvents: ['custom:configure'] } });
    expect(response.lifecycle.readyEvents).toEqual(['custom:configure']);
    expect(window.hyvaflow.lifecycle().readyEvents).toEqual(['custom:configure']);
    const snapshot = window.hyvaflow.configure();
    expect(snapshot.lifecycle.readyEvents).toEqual(['custom:configure']);
  });
});
