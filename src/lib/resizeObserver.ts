// src/lib/resizeObserver.ts
type ResizeCallback = (entry: ResizeObserverEntry) => void;

const callbacks = new WeakMap<Element, ResizeCallback>();

let observer: ResizeObserver | null = null;

function getObserver(): ResizeObserver {
  if (observer) return observer;
  observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const cb = callbacks.get(entry.target);
      if (cb) cb(entry);
    }
  });
  return observer;
}

export function observe(el: Element, callback: ResizeCallback) {
  callbacks.set(el, callback);
  getObserver().observe(el);
}

export function unobserve(el: Element) {
  callbacks.delete(el);
  getObserver().unobserve(el);
}
