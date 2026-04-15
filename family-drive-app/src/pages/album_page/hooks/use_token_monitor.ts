import { useState, useEffect } from "react";

import { useAuthStore } from "../../../stores/auth_store";

export function useTokenMonitor() {
  const tokenExpiry = useAuthStore((s) => s.tokenExpiry);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);

  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      // expireToken() 把 tokenExpiry 設為 -1，這裡直接判斷是否過期
      setIsTokenExpired(tokenExpiry !== null && tokenExpiry < Date.now());
      return;
    }
    if (!tokenExpiry) {
      setIsTokenExpired(false);
      return;
    }
    const checkExpiry = () => {
      const timeUntilExpiry = tokenExpiry - Date.now();
      setIsTokenExpired(timeUntilExpiry < 0);
    };
    checkExpiry();
    const interval = setInterval(checkExpiry, 60000);
    return () => clearInterval(interval);
  }, [tokenExpiry, accessToken]);

  const handleRefreshToken = async () => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    try {
      await refreshToken();
      setIsTokenExpired(false);
    } catch (err) {
      console.error("Token 刷新失敗:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    isTokenExpired,
    isRefreshing,
    handleRefreshToken,
  };
}
