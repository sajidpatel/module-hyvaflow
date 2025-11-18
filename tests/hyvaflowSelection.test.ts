import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createHyvaFlowCore } from '../view/frontend/web/src/core';
import { createDomEnhancedFlow } from '../view/frontend/web/src/hyvaflow';

describe('HyvaFlow selection API', () => {
  let flowWithDom: ReturnType<typeof createDomEnhancedFlow>['flowWithDom'];

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="card" id="card-1"></div>
      <div class="card" id="card-2"></div>
    `;
    const { flowWithDom: selection } = createDomEnhancedFlow(createHyvaFlowCore());
    flowWithDom = selection.select('.card');
  });

  it('adds/removes/toggles classes', () => {
    expect(flowWithDom.hasClass('is-hot')).toBe(false);
    flowWithDom.addClass('is-hot');
    expect(flowWithDom.hasClass('is-hot')).toBe(true);
    flowWithDom.toggleClass('is-hot');
    expect(flowWithDom.hasClass('is-hot')).toBe(false);
    flowWithDom.apply('is-hot', true);
    expect(flowWithDom.hasClass('is-hot')).toBe(true);
    flowWithDom.apply('is-hot', false);
    expect(flowWithDom.hasClass('is-hot')).toBe(false);
  });

  it('sets attributes', () => {
    flowWithDom.set('data-test', 'yes');
    expect((flowWithDom.first() as Element).getAttribute('data-test')).toBe('yes');
  });

  it('registers DOM event handlers via onEvent', () => {
    const handler = vi.fn();
    flowWithDom.onEvent('click', handler);
    (flowWithDom.first() as Element).dispatchEvent(new Event('click'));
    expect(handler).toHaveBeenCalled();
  });

  it('iterates with each/forEach and exposes toArray', () => {
    const ids: string[] = [];
    flowWithDom.each((node) => ids.push((node as Element).id));
    expect(ids).toEqual(['card-1', 'card-2']);
    const idsForEach: string[] = [];
    flowWithDom.forEach((node) => idsForEach.push((node as Element).id));
    expect(idsForEach).toEqual(ids);
    expect(flowWithDom.toArray().length).toBe(2);
    expect([...flowWithDom].length).toBe(2);
  });

  it('bridges static debug setter to instances', () => {
    const { HyvaFlowConstructor, flowWithDom: selection } = createDomEnhancedFlow(createHyvaFlowCore());
    expect(selection.debug()).toBe(false);
    HyvaFlowConstructor.debug = true;
    expect(selection.debug()).toBe(true);
  });
});
