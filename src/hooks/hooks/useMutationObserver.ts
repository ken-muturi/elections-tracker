"use client"

import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';
import { RefObject } from 'react';

const useMutationObserver = (
  ref: RefObject<HTMLElement>,
  callback: () => void,
  options = {
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true,
  }
) => {
  useIsomorphicLayoutEffect(() => {
    if (ref.current) {
      const observer = new MutationObserver(callback);
      observer.observe(ref.current, options);
      return () => observer.disconnect();
    }
  }, [callback, options]);
};

export default useMutationObserver;