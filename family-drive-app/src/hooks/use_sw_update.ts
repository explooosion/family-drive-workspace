import { useEffect, useState } from "react";

export function useSwUpdate(): { updateReady: boolean; applyUpdate: () => void } {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(function registerAndWatch() {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    let reg: ServiceWorkerRegistration;

    navigator.serviceWorker
      .register("/family-drive-workspace/sw.js")
      .then((r) => {
        reg = r;
        setRegistration(r);

        if (r.waiting) {
          setUpdateReady(true);
        }

        r.addEventListener("updatefound", () => {
          const installing = r.installing;
          if (!installing) {
            return;
          }
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateReady(true);
            }
          });
        });
      })
      .catch(() => {
        // SW registration failed silently (e.g. in dev without HTTPS)
      });

    const handleControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    const interval = setInterval(() => {
      if (reg) {
        reg.update().catch(() => undefined);
      }
    }, 60_000);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      clearInterval(interval);
    };
  }, []);

  function applyUpdate() {
    if (!registration?.waiting) {
      return;
    }
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  }

  return { updateReady, applyUpdate };
}
