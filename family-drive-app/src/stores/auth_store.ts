import { create } from "zustand";
import type { User } from "firebase/auth";
import { onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

import { auth, db, googleProvider } from "../services/firebase";
import type { UserInfo } from "../types";

type AuthState = {
  firebaseReady: boolean;
  user: User | null;
  userInfo: UserInfo | null;
  accessToken: string | null;
  tokenExpiry: number | null;
  loading: boolean;
  authenticating: boolean;
  error: string | null;
  init: () => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  expireToken: () => void;
};

export const useAuthStore = create<AuthState>((setState, getState) => ({
  firebaseReady: false,
  user: null,
  userInfo: null,
  accessToken: null,
  tokenExpiry: null,
  loading: false,
  authenticating: false,
  error: null,

  init() {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({
          firebaseReady: true,
          authenticating: false,
          user: null,
          userInfo: null,
          accessToken: null,
          tokenExpiry: null,
        });
        localStorage.removeItem("google_access_token");
        localStorage.removeItem("google_access_token_expiry");
        return;
      }

      // 開始驗證流程，顯示 loading
      setState({ authenticating: true, error: null });
      console.log("Auth state changed, user:", user);

      // 設定 10 秒逾時
      const timeoutId = setTimeout(() => {
        console.error("Authentication timeout");
        setState({
          firebaseReady: true,
          authenticating: false,
          error: "驗證逾時，請重新登入。",
        });
        signOut(auth);
      }, 10000);

      try {
        // 檢查用戶是否存在於 users collection（Firestore 作為家庭成員白名單）
        const userRef = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userRef);

        let userInfo: UserInfo;

        if (!userSnapshot.exists()) {
          // UID 不在 Firestore users collection → 未授權，立即登出
          clearTimeout(timeoutId);
          await signOut(auth);
          localStorage.removeItem("google_access_token");
          localStorage.removeItem("google_access_token_expiry");
          setState({
            firebaseReady: true,
            authenticating: false,
            user: null,
            userInfo: null,
            accessToken: null,
            tokenExpiry: null,
            error: "帳號沒有授權，請聯繫管理員。",
          });
          return;
        } else {
          const userData = userSnapshot.data() as Partial<UserInfo>;

          userInfo = {
            uid: user.uid,
            email: user.email ?? userData.email ?? "",
            displayName: user.displayName ?? userData.displayName ?? "",
            photoURL: user.photoURL ?? userData.photoURL ?? "",
            role: userData.role ?? "member",
            lastLoginAt: Date.now(),
            createdAt: userData.createdAt ?? Date.now(),
          };

          // 補全遺失欄位並同步 Google 帳號最新資料
          const updates: Record<string, unknown> = { lastLoginAt: serverTimestamp() };
          if (user.email && userData.email !== user.email) {
            updates.email = user.email;
          }
          if (user.displayName && userData.displayName !== user.displayName) {
            updates.displayName = user.displayName;
          }
          if (user.photoURL && userData.photoURL !== user.photoURL) {
            updates.photoURL = user.photoURL;
          }
          if (!userData.role) {
            updates.role = "member";
          }
          await updateDoc(userRef, updates);
        }

        // 清除逾時計時器
        clearTimeout(timeoutId);

        // 在所有 async 操作完成後，再次讀取 localStorage 中的 token
        // 這樣可以確保在登入流程中設置的 token 不會被覆蓋
        const savedToken = localStorage.getItem("google_access_token");
        const savedTokenExpiry = localStorage.getItem("google_access_token_expiry");

        // 檢查 token 是否過期
        const isTokenExpired = savedTokenExpiry && Date.now() > Number.parseInt(savedTokenExpiry);

        setState({
          firebaseReady: true,
          authenticating: false,
          user,
          userInfo,
          accessToken: isTokenExpired ? null : savedToken,
          tokenExpiry: isTokenExpired
            ? -1
            : savedTokenExpiry
              ? Number.parseInt(savedTokenExpiry)
              : null,
          error: null,
        });
      } catch (err) {
        clearTimeout(timeoutId);
        console.error("Auth init error:", err);
        await signOut(auth);
        setState({
          firebaseReady: true,
          authenticating: false,
          user: null,
          userInfo: null,
          accessToken: null,
          tokenExpiry: null,
          error: `驗證過程發生錯誤: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    });
  },

  async login() {
    setState({ loading: true, error: null });
    try {
      const result = await signInWithPopup(auth, googleProvider);

      // 以 Firestore users collection 為白名單：僅允許管理員已建立資料的使用者
      const userRef = doc(db, "users", result.user.uid);
      const userSnapshot = await getDoc(userRef);
      if (!userSnapshot.exists()) {
        await signOut(auth);
        setState({ error: "帳號沒有授權，請聯繫管理員。", loading: false });
        return;
      }

      // 從 Firebase 登入結果取得 Google OAuth credential
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        // Google OAuth token 通常有效期為 1 小時
        const expiryTime = Date.now() + 3600 * 1000;

        // 儲存 access token 和過期時間到 localStorage
        localStorage.setItem("google_access_token", credential.accessToken);
        localStorage.setItem("google_access_token_expiry", expiryTime.toString());

        setState({
          accessToken: credential.accessToken,
          tokenExpiry: expiryTime,
        });
      } else {
        throw new Error("無法取得 Google Drive 存取權限");
      }

      setState({ loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "登入失敗";
      if (!message.includes("popup-closed-by-user")) {
        setState({ error: message, loading: false });
      } else {
        setState({ loading: false });
      }
    }
  },

  async refreshToken() {
    const { user } = getState();
    if (!user) {
      return;
    }

    setState({ loading: true, error: null });
    try {
      // 使用重新登入取得新的 token
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (credential?.accessToken) {
        const expiryTime = Date.now() + 3600 * 1000;

        localStorage.setItem("google_access_token", credential.accessToken);
        localStorage.setItem("google_access_token_expiry", expiryTime.toString());

        setState({
          accessToken: credential.accessToken,
          tokenExpiry: expiryTime,
          loading: false,
        });
      } else {
        throw new Error("無法刷新 Google Drive 存取權限");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "權限刷新失敗";
      setState({ error: message, loading: false });
      throw err;
    }
  },

  // 由 Google Drive API 回側 401 時呼叫，清除 token 並標記為已過期
  expireToken() {
    localStorage.removeItem("google_access_token");
    localStorage.removeItem("google_access_token_expiry");
    // tokenExpiry = -1 讓 use_token_monitor 偵測為已過期，顯示重新授權按鈕
    setState({ accessToken: null, tokenExpiry: -1 });
  },

  async logout() {
    await signOut(auth);
    localStorage.removeItem("google_access_token");
    localStorage.removeItem("google_access_token_expiry");
    setState({
      user: null,
      userInfo: null,
      accessToken: null,
      tokenExpiry: null,
    });
  },
}));
