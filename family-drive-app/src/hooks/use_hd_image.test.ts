import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useHdImage } from "./use_hd_image";

describe("useHdImage", () => {
  let observerCallback: IntersectionObserverCallback;
  const observeMock = vi.fn();
  const disconnectMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    observerCallback = () => {};

    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: IntersectionObserverCallback) {
          observerCallback = cb;
        }
        observe = observeMock;
        unobserve = vi.fn();
        disconnect = disconnectMock;
      },
    );

    // Image mock：設定 src 後同步觸發 onload
    vi.stubGlobal(
      "Image",
      class {
        onload: (() => void) | null = null;
        private _src = "";
        get src() {
          return this._src;
        }
        set src(value: string) {
          this._src = value;
          this.onload?.();
        }
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("初始狀態回傳 thumbnailSrc", () => {
    const { result } = renderHook(() => useHdImage("https://example.com/photo=s220", true));
    expect(result.current.displaySrc).toBe("https://example.com/photo=s220");
  });

  it("元素進入 viewport 後 3 秒切換為 HD src", async () => {
    const el = document.createElement("div");
    const { result } = renderHook(() => useHdImage("https://example.com/photo=s220", true));

    // 掛載容器元素，觸發 IntersectionObserver 初始化
    await act(async () => {
      result.current.containerRef(el);
    });

    // 進入 viewport + 前進 5 秒
    await act(async () => {
      observerCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.displaySrc).toBe("https://example.com/photo=s2000");
  });

  it("離開 viewport 後取消計時器，不切換 HD", async () => {
    const el = document.createElement("div");
    const { result } = renderHook(() => useHdImage("https://example.com/photo=s220", true));

    await act(async () => {
      result.current.containerRef(el);
    });

    await act(async () => {
      // 進入 viewport，等待 2 秒
      observerCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
      vi.advanceTimersByTime(2000);

      // 離開 viewport（取消計時器）
      observerCallback(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );

      // 再等 3 秒（計時器已取消，不應觸發 HD 切換）
      vi.advanceTimersByTime(3001);
    });

    expect(result.current.displaySrc).toBe("https://example.com/photo=s220");
  });

  it("enabled=false 時不設置 observer，不切換 HD", async () => {
    const el = document.createElement("div");
    const { result } = renderHook(() => useHdImage("https://example.com/photo=s220", false));

    await act(async () => {
      result.current.containerRef(el);
    });

    // observerCallback 未被覆寫（enabled=false 跳過 effect），不執行動作
    await act(async () => {
      vi.advanceTimersByTime(6000);
    });

    expect(result.current.displaySrc).toBe("https://example.com/photo=s220");
  });

  it("thumbnailSrc 無 =s<n> 參數時，直接使用原 URL 載入", async () => {
    const el = document.createElement("div");
    const { result } = renderHook(() => useHdImage("https://example.com/photo.jpg", true));

    await act(async () => {
      result.current.containerRef(el);
    });

    await act(async () => {
      observerCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
      vi.advanceTimersByTime(3000);
    });

    // 沒有 =s<n> pattern，hdUrl fallback 為原始 URL
    expect(result.current.displaySrc).toBe("https://example.com/photo.jpg");
  });
});
