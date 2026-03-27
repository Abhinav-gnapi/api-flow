import { useInsertionEffect, useLayoutEffect } from 'react';

const useStyleEffect =
  typeof useInsertionEffect === 'function' ? useInsertionEffect : useLayoutEffect;

export function useInlinePageStyles(styleId, cssText) {
  useStyleEffect(() => {
    if (typeof document === 'undefined') return;

    let styleTag = document.getElementById(styleId);
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      styleTag.setAttribute('data-inline-page-style', 'true');
      document.head.appendChild(styleTag);
    }

    if (styleTag.textContent !== cssText) {
      styleTag.textContent = cssText;
    }

    return () => {
      if (styleTag?.parentNode) {
        styleTag.parentNode.removeChild(styleTag);
      }
    };
  }, [styleId, cssText]);
}
