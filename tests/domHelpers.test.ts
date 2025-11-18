import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createHyvaFlowCore } from '../view/frontend/web/src/core';
import { createDomEnhancedFlow } from '../view/frontend/web/src/hyvaflow';
import { registerDomListener, normalizeStack } from '../view/frontend/web/src/domHelpers';

describe('DOM helpers', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="card" data-test>
        <button class="btn">Click</button>
      </div>
      <div class="card second">
        <button class="btn">Second</button>
      </div>
    `;
  });

  it('select caches nodes until refresh', () => {
    const core = createHyvaFlowCore();
    const { flowWithDom } = createDomEnhancedFlow(core);
    const firstSelect = flowWithDom.select('.card');
    const secondSelect = flowWithDom.select('.card');
    expect(firstSelect.toArray()).toEqual(secondSelect.toArray());
    window.hyvaflow.trigger('hyva:flow:dom:refresh');
    const thirdSelect = flowWithDom.select('.card');
    expect(thirdSelect.toArray()).toEqual(firstSelect.toArray());
  });

  it('closest finds unique ancestors', () => {
    const core = createHyvaFlowCore();
    const { flowWithDom } = createDomEnhancedFlow(core);
    const closest = flowWithDom.select('.btn').closest('.card');
    expect(closest.length).toBe(2);
  });

  it('find behaves as alias of select', () => {
    const core = createHyvaFlowCore();
    const { flowWithDom } = createDomEnhancedFlow(core);
    const select = flowWithDom.select('.btn');
    const find = flowWithDom.find('.btn');
    expect(find.toArray()).toEqual(select.toArray());
  });

  it('addDomListener select fires immediately and on refresh', () => {
    const core = createHyvaFlowCore();
    const { flowWithDom } = createDomEnhancedFlow(core);
    const handler = vi.fn();
    flowWithDom.addDomListener('select', '.card', handler);
    expect(handler).toHaveBeenCalledTimes(2);
    document.body.insertAdjacentHTML('beforeend', '<div class="card third"></div>');
    window.hyvaflow.trigger('hyva:flow:dom:refresh');
    expect(handler).toHaveBeenCalledTimes(5);
  });

  it('registerDomListener delegates non-select events and overrides target', () => {
    const handler = vi.fn();
    registerDomListener('click', '.card', handler);
    document.querySelector('.btn')!.dispatchEvent(new Event('click', { bubbles: true }));
    const payload = handler.mock.calls[0][0];
    expect(payload?.target).toBe(document.querySelector('.card'));
  });

  it('registerDomListener uses capture for focus', () => {
    const handler = vi.fn();
    registerDomListener('focus', '.btn', handler);
    (document.querySelector('.btn') as HTMLElement).dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    expect(handler).toHaveBeenCalled();
  });

  it('normalizeStack handles arrays and NodeList', () => {
    const nodes = document.querySelectorAll('.card');
    expect(normalizeStack(nodes).length).toBe(2);
    expect(normalizeStack([document.createElement('div')]).length).toBe(1);
  });

  it('gracefully handles non-browser environments', async () => {
    const originalWindow = global.window;
    const originalDocument = global.document;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete global.window;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete global.document;
    vi.resetModules();
    const mod = await import('../view/frontend/web/src/domHelpers');
    expect(mod.normalizeStack()).toEqual([]);
    vi.resetModules();
    global.window = originalWindow;
    global.document = originalDocument;
  });
});
