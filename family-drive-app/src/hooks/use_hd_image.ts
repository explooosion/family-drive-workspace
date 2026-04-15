import { useState, useRef, useEffect, useCallback } from "react";

const HD_DELAY_MS = 3000;
const HD_SIZE_RE = /=s\d+/;
const HD_SIZE_SUFFIX = "=s2000";
const HD_QUERY_SIZE = "2000";

type UseHdImageReturn = {
  displaySrc: string;
  containerRef: (node: HTMLDivElement | null) => void;
};

/**
 * 在縮圖進入 viewport 後延遲 5 秒切換為 HD 版本。
 * 若元素離開 viewport 則取消計時器，避免浪費頻寬。
 *
 * @param thumbnailSrc - 原縮圖 URL（含 =s<n> 尺寸參數）
 * @param enabled - false 時完全跳過，直接回傳 thumbnailSrc
 */
export function useHdImage(
  thumbnailSrc: string,
  enabled: boolean,
  delayMs = HD_DELAY_MS,
): UseHdImageReturn {
  const [displaySrc, setDisplaySrc] = useState(thumbnailSrc);
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hdLoadedRef = useRef(false);

  useEffect(() => {
    setDisplaySrc(thumbnailSrc);
  }, [thumbnailSrc]);

  function resolveHdUrl(src: string): string {
    if (HD_SIZE_RE.test(src)) {
      return src.replace(HD_SIZE_RE, HD_SIZE_SUFFIX);
    }

    try {
      const url = new URL(src);

      if (url.searchParams.has("size")) {
        url.searchParams.set("size", HD_QUERY_SIZE);
        return url.toString();
      }
    } catch {
      return src;
    }

    return src;
  }

  useEffect(
    function observeViewport() {
      if (!enabled || !thumbnailSrc || !element) {
        return;
      }
      // thumbnailSrc 變更時重置 HD 旗標（在 effect 中設定 ref 是合法的）
      hdLoadedRef.current = false;

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              if (!timerRef.current && !hdLoadedRef.current) {
                timerRef.current = setTimeout(() => {
                  const hdUrl = resolveHdUrl(thumbnailSrc);
                  const img = new globalThis.Image();
                  img.onload = () => {
                    setDisplaySrc(hdUrl);
                    hdLoadedRef.current = true;
                  };
                  img.src = hdUrl;
                  timerRef.current = null;
                }, delayMs);
              }
            } else {
              if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
              }
            }
          }
        },
        { threshold: 0.1 },
      );

      observer.observe(element);

      return () => {
        observer.disconnect();
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    },
    [thumbnailSrc, enabled, element, delayMs],
  );

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    setElement(node);
  }, []);

  return { displaySrc, containerRef };
}
