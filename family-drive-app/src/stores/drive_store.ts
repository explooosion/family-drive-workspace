import { create } from "zustand";

import { useAuthStore } from "./auth_store";
import {
  listFiles,
  ensureRootFolder,
  ensureTrashFolder,
  createFolder,
  softDeleteFile,
  renameFile,
  getChangesStartToken,
  getChangesSince,
} from "../services/google_drive";
import type { DriveFile } from "../types";

type FolderStackItem = {
  id: string;
  name: string;
};

type FolderPrefs = {
  viewMode?: "large" | "medium" | "small" | "list" | "detail";
  sortBy?: "name" | "modifiedTime";
  sortOrder?: "asc" | "desc";
};

function prefsKey(folderId: string) {
  return `folder_prefs_${folderId}`;
}

function loadFolderPrefs(folderId: string): FolderPrefs {
  try {
    const raw = localStorage.getItem(prefsKey(folderId));
    return raw ? (JSON.parse(raw) as FolderPrefs) : {};
  } catch {
    return {};
  }
}

function saveFolderPrefs(folderId: string, patch: FolderPrefs) {
  try {
    const existing = loadFolderPrefs(folderId);
    localStorage.setItem(prefsKey(folderId), JSON.stringify({ ...existing, ...patch }));
  } catch {
    // ignore
  }
}

const FOLDER_CACHE_KEY = "drive_folder_cache";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 天
const CHANGES_TOKEN_KEY = "drive_changes_token";

type StoredCacheEntry = { files: DriveFile[]; cachedAt: number };
type StoredFolderCache = Record<string, StoredCacheEntry>;

function loadCacheFromStorage(): { cache: Map<string, DriveFile[]>; staleIds: Set<string> } {
  try {
    const raw = localStorage.getItem(FOLDER_CACHE_KEY);
    if (!raw) {
      return { cache: new Map(), staleIds: new Set() };
    }
    const obj = JSON.parse(raw) as StoredFolderCache;
    const cache = new Map<string, DriveFile[]>();
    const staleIds = new Set<string>();
    const now = Date.now();
    for (const [id, entry] of Object.entries(obj)) {
      cache.set(id, entry.files);
      if (now - entry.cachedAt >= CACHE_TTL_MS) {
        staleIds.add(id);
      }
    }
    return { cache, staleIds };
  } catch {
    return { cache: new Map(), staleIds: new Set() };
  }
}

function saveCacheToStorage(cache: Map<string, DriveFile[]>) {
  try {
    const obj: StoredFolderCache = {};
    const now = Date.now();
    cache.forEach((files, id) => {
      // 每次寫入都使用當下時間作為新的 cachedAt，重設 TTL
      obj[id] = { files, cachedAt: now };
    });
    localStorage.setItem(FOLDER_CACHE_KEY, JSON.stringify(obj));
  } catch {
    // ignore storage quota errors
  }
}

function updateCacheEntryTimestamp(folderId: string) {
  try {
    const raw = localStorage.getItem(FOLDER_CACHE_KEY);
    if (!raw) {
      return;
    }
    const obj = JSON.parse(raw) as StoredFolderCache;
    if (obj[folderId]) {
      obj[folderId] = { ...obj[folderId], cachedAt: Date.now() };
      localStorage.setItem(FOLDER_CACHE_KEY, JSON.stringify(obj));
    }
  } catch {
    // ignore
  }
}

function areCachesIdentical(a: DriveFile[], b: DriveFile[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function loadChangesToken(): string | null {
  try {
    return localStorage.getItem(CHANGES_TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveChangesToken(token: string) {
  try {
    localStorage.setItem(CHANGES_TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

type DriveState = {
  rootFolderId: string | null;
  currentFolderId: string | null;
  folderStack: FolderStackItem[];
  files: DriveFile[];
  loading: boolean;
  error: string | null;
  viewMode: "large" | "medium" | "small" | "list" | "detail";
  sortBy: "name" | "modifiedTime";
  sortOrder: "asc" | "desc";
  selectedIds: Set<string>;
  selectionMode: boolean;
  folderCache: Map<string, DriveFile[]>;
  staleFolderIds: Set<string>;
  changesToken: string | null;
  syncChanges: (accessToken: string) => Promise<void>;
  initRootFolder: (accessToken: string) => Promise<void>;
  forceRefreshCurrentFolder: (accessToken: string) => Promise<void>;
  navigateToFolder: (folderId: string, folderName: string) => void;
  navigateBack: () => void;
  navigateToRoot: () => void;
  restoreFolderStack: (stack: FolderStackItem[]) => void;
  refreshFiles: (accessToken: string) => Promise<void>;
  setViewMode: (viewMode: "large" | "medium" | "small" | "list" | "detail") => void;
  setSorting: (sortBy: "name" | "modifiedTime", sortOrder: "asc" | "desc") => void;
  toggleSelection: (fileId: string) => void;
  enterSelectionMode: (fileId?: string) => void;
  exitSelectionMode: () => void;
  createAlbum: (accessToken: string, name: string) => Promise<void>;
  createSubFolder: (accessToken: string, name: string) => Promise<void>;
  softDelete: (accessToken: string, fileId: string) => Promise<void>;
  renameItem: (accessToken: string, fileId: string, newName: string) => Promise<void>;
};

function sortFiles(files: DriveFile[], sortBy: "name" | "modifiedTime", sortOrder: "asc" | "desc") {
  return [...files].sort((a, b) => {
    // 資料夾永遠在前面
    const aIsFolder = a.mimeType === "application/vnd.google-apps.folder";
    const bIsFolder = b.mimeType === "application/vnd.google-apps.folder";

    if (aIsFolder && !bIsFolder) {
      return -1;
    }
    if (!aIsFolder && bIsFolder) {
      return 1;
    }

    // 同類型才按照排序條件
    let comparison = 0;
    if (sortBy === "name") {
      comparison = a.name.localeCompare(b.name);
    } else {
      const aTime = a.modifiedTime ? new Date(a.modifiedTime).getTime() : 0;
      const bTime = b.modifiedTime ? new Date(b.modifiedTime).getTime() : 0;
      comparison = aTime - bTime;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });
}

const { cache: initialCache, staleIds: initialStaleIds } = loadCacheFromStorage();

export const useDriveStore = create<DriveState>((setState, getState) => ({
  rootFolderId: null,
  currentFolderId: null,
  folderStack: [],
  files: [],
  loading: false,
  error: null,
  viewMode: "small", // 預設小縮圖
  sortBy: "name",
  sortOrder: "desc",
  selectedIds: new Set(),
  selectionMode: false,
  folderCache: initialCache,
  // 只將超過 1 天的資料億標記為需要背景驗證
  staleFolderIds: initialStaleIds,
  changesToken: loadChangesToken(),

  async syncChanges(accessToken: string) {
    const { changesToken, folderCache } = getState();

    if (!changesToken) {
      // 第一次使用：取得起始 token，不需要查詢變更
      try {
        const token = await getChangesStartToken(accessToken);
        saveChangesToken(token);
        setState({ changesToken: token });
      } catch {
        // 取得 token 失敗不阻斷初始化流程
      }
      return;
    }

    try {
      const { affectedParentIds, newPageToken } = await getChangesSince(accessToken, changesToken);
      saveChangesToken(newPageToken);
      setState({ changesToken: newPageToken });

      if (affectedParentIds.size === 0) {
        return;
      }

      // 將有變更的資料夾加入 staleFolderIds，讓 refreshFiles 背景重取
      const newStale = new Set(getState().staleFolderIds);
      for (const id of affectedParentIds) {
        if (folderCache.has(id)) {
          newStale.add(id);
        }
      }
      setState({ staleFolderIds: newStale });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("401")) {
        useAuthStore.getState().expireToken();
      }
      // 其他錯誤（如網路問題）靜默失敗，不中斷初始化
    }
  },
  async forceRefreshCurrentFolder(accessToken: string) {
    const { currentFolderId } = getState();
    if (!currentFolderId) {
      return;
    }
    const newCache = new Map(getState().folderCache);
    newCache.delete(currentFolderId);
    const newStale = new Set(getState().staleFolderIds);
    newStale.delete(currentFolderId);
    saveCacheToStorage(newCache);
    setState({ folderCache: newCache, staleFolderIds: newStale, loading: true });
    await getState().refreshFiles(accessToken);
  },

  async initRootFolder(accessToken: string) {
    setState({ loading: true, error: null });
    try {
      const root = await ensureRootFolder(accessToken);
      setState({
        rootFolderId: root.id,
        currentFolderId: root.id,
        folderStack: [{ id: root.id, name: root.name }],
      });
      await getState().refreshFiles(accessToken);
    } catch (err) {
      const message = err instanceof Error ? err.message : "初始化失敗";
      setState({ loading: false });
      if (message.includes("401")) {
        useAuthStore.getState().expireToken();
        return;
      }
      setState({ error: message });
    }
  },

  navigateToFolder(folderId: string, folderName: string) {
    const { folderStack, folderCache } = getState();
    const prefs = loadFolderPrefs(folderId);
    const cached = folderCache.get(folderId);
    setState({
      currentFolderId: folderId,
      folderStack: [...folderStack, { id: folderId, name: folderName }],
      selectedIds: new Set(),
      selectionMode: false,
      files: cached ?? [],
      loading: !cached,
      ...(prefs.viewMode ? { viewMode: prefs.viewMode } : {}),
      ...(prefs.sortBy ? { sortBy: prefs.sortBy } : {}),
      ...(prefs.sortOrder ? { sortOrder: prefs.sortOrder } : {}),
    });
  },

  navigateBack() {
    const { folderStack, folderCache } = getState();
    if (folderStack.length <= 1) {
      return;
    }
    const newStack = folderStack.slice(0, -1);
    const prevFolder = newStack[newStack.length - 1];
    const prefs = loadFolderPrefs(prevFolder.id);
    const cached = folderCache.get(prevFolder.id);
    setState({
      currentFolderId: newStack[newStack.length - 1].id,
      folderStack: newStack,
      selectedIds: new Set(),
      selectionMode: false,
      files: cached ?? [],
      loading: !cached,
      ...(prefs.viewMode ? { viewMode: prefs.viewMode } : { viewMode: "small" }),
      ...(prefs.sortBy ? { sortBy: prefs.sortBy } : {}),
      ...(prefs.sortOrder ? { sortOrder: prefs.sortOrder } : {}),
    });
  },

  navigateToRoot() {
    const { rootFolderId, folderStack, folderCache } = getState();
    if (!rootFolderId || folderStack.length <= 1) {
      return;
    }
    const cached = folderCache.get(rootFolderId);
    setState({
      currentFolderId: rootFolderId,
      folderStack: [folderStack[0]],
      selectedIds: new Set(),
      selectionMode: false,
      files: cached ?? [],
      loading: !cached,
    });
  },

  restoreFolderStack(stack: FolderStackItem[]) {
    if (stack.length === 0) {
      return;
    }
    const last = stack[stack.length - 1];
    const prefs = loadFolderPrefs(last.id);
    const cached = getState().folderCache.get(last.id);
    setState({
      currentFolderId: last.id,
      folderStack: stack,
      selectedIds: new Set(),
      selectionMode: false,
      files: cached ?? [],
      loading: !cached,
      ...(prefs.viewMode ? { viewMode: prefs.viewMode } : {}),
      ...(prefs.sortBy ? { sortBy: prefs.sortBy } : {}),
      ...(prefs.sortOrder ? { sortOrder: prefs.sortOrder } : {}),
    });
  },

  async refreshFiles(accessToken: string) {
    const { currentFolderId, folderStack, sortBy, sortOrder, folderCache, staleFolderIds } =
      getState();
    if (!currentFolderId) {
      return;
    }
    const cached = folderCache.get(currentFolderId);
    const isStale = staleFolderIds.has(currentFolderId);

    // 本次連線已從 Google 取得，直接返回記憑區資料
    if (cached && !isStale) {
      setState({ files: cached, loading: false });
      return;
    }

    if (cached && isStale) {
      // 來自 localStorage，先呈現舊資料，同時背景取得最新資料進行比對
      setState({ files: cached, loading: false });
      try {
        const { files } = await listFiles(accessToken, currentFolderId);
        const isRoot = folderStack.length <= 1;
        const effectiveSortOrder: "asc" | "desc" = isRoot ? "desc" : sortOrder;
        const sortedFiles = sortFiles(files, sortBy, effectiveSortOrder);

        // 該資料億已經驗證完成，從 stale 中移除
        const newStale = new Set(getState().staleFolderIds);
        newStale.delete(currentFolderId);
        const newCache = new Map(getState().folderCache);
        newCache.set(currentFolderId, sortedFiles);
        saveCacheToStorage(newCache);

        if (!areCachesIdentical(cached, sortedFiles)) {
          // 云端資料有變化，更新 UI（saveCacheToStorage 已寫入新 cachedAt）
          setState({
            files: sortedFiles,
            sortOrder: effectiveSortOrder,
            folderCache: newCache,
            staleFolderIds: newStale,
          });
        } else {
          // 資料一致，重設 cachedAt 為現在（重新計算 1 天 TTL）
          updateCacheEntryTimestamp(currentFolderId);
          setState({ folderCache: newCache, staleFolderIds: newStale });
        }
      } catch (err) {
        // 背景驗證失敗——保留舊資料，清除 stale 標記避免重試
        const newStale = new Set(getState().staleFolderIds);
        newStale.delete(currentFolderId);
        setState({ staleFolderIds: newStale });
        const message = err instanceof Error ? err.message : "";
        if (message.includes("401")) {
          useAuthStore.getState().expireToken();
        }
      }
      return;
    }

    // 完全沒有緩存 — 完整 loading + 取得
    setState({ loading: true, error: null });
    try {
      const { files } = await listFiles(accessToken, currentFolderId);
      const isRoot = folderStack.length <= 1;
      // 根層級固定 Z-A（相簿按日期降序），子目錄尊重用戶設定（預設 A-Z）
      const effectiveSortOrder: "asc" | "desc" = isRoot ? "desc" : sortOrder;
      const sortedFiles = sortFiles(files, sortBy, effectiveSortOrder);
      const newCache = new Map(getState().folderCache);
      newCache.set(currentFolderId, sortedFiles);
      saveCacheToStorage(newCache);
      setState({
        files: sortedFiles,
        sortOrder: effectiveSortOrder,
        loading: false,
        folderCache: newCache,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "載入檔案失敗";
      setState({ loading: false });
      if (message.includes("401")) {
        useAuthStore.getState().expireToken();
        return;
      }
      setState({ error: message });
    }
  },

  setViewMode(viewMode: "large" | "medium" | "small" | "list" | "detail") {
    const { currentFolderId } = getState();
    setState({ viewMode });
    if (currentFolderId) {
      saveFolderPrefs(currentFolderId, { viewMode });
    }
  },

  setSorting(sortBy: "name" | "modifiedTime", sortOrder: "asc" | "desc") {
    const { files, currentFolderId } = getState();
    const sortedFiles = sortFiles(files, sortBy, sortOrder);
    setState({ sortBy, sortOrder, files: sortedFiles });
    if (currentFolderId) {
      saveFolderPrefs(currentFolderId, { sortBy, sortOrder });
    }
  },

  toggleSelection(fileId: string) {
    const { selectedIds } = getState();
    const newSet = new Set(selectedIds);
    if (newSet.has(fileId)) {
      newSet.delete(fileId);
    } else {
      newSet.add(fileId);
    }
    setState({ selectedIds: newSet });
  },

  enterSelectionMode(fileId?: string) {
    setState({
      selectionMode: true,
      selectedIds: fileId ? new Set([fileId]) : new Set(),
    });
  },

  exitSelectionMode() {
    setState({
      selectionMode: false,
      selectedIds: new Set(),
    });
  },

  async createAlbum(accessToken: string, name: string) {
    const { rootFolderId, folderCache } = getState();
    if (!rootFolderId) {
      throw new Error("Root folder not initialized");
    }
    await createFolder(accessToken, name, rootFolderId);
    const newCache = new Map(folderCache);
    newCache.delete(rootFolderId);
    const newStale = new Set(getState().staleFolderIds);
    newStale.delete(rootFolderId);
    saveCacheToStorage(newCache);
    setState({ folderCache: newCache, staleFolderIds: newStale });
    await getState().refreshFiles(accessToken);
  },

  async createSubFolder(accessToken: string, name: string) {
    const { currentFolderId, folderCache } = getState();
    if (!currentFolderId) {
      throw new Error("No current folder");
    }
    await createFolder(accessToken, name, currentFolderId);
    const newCache = new Map(folderCache);
    newCache.delete(currentFolderId);
    const newStale = new Set(getState().staleFolderIds);
    newStale.delete(currentFolderId);
    saveCacheToStorage(newCache);
    setState({ folderCache: newCache, staleFolderIds: newStale });
    await getState().refreshFiles(accessToken);
  },

  async softDelete(accessToken: string, fileId: string) {
    const { currentFolderId, folderCache } = getState();
    if (!currentFolderId) {
      return;
    }
    const trashFolder = await ensureTrashFolder(accessToken);
    await softDeleteFile(accessToken, fileId, trashFolder.id, currentFolderId);
    const newCache = new Map(folderCache);
    newCache.delete(currentFolderId);
    const newStale = new Set(getState().staleFolderIds);
    newStale.delete(currentFolderId);
    saveCacheToStorage(newCache);
    setState({ folderCache: newCache, staleFolderIds: newStale });
    await getState().refreshFiles(accessToken);
  },

  async renameItem(accessToken: string, fileId: string, newName: string) {
    const { currentFolderId, folderCache, files } = getState();
    await renameFile(accessToken, fileId, newName);
    // Optimistically update local state immediately
    const newFiles = files.map((f) => (f.id === fileId ? { ...f, name: newName } : f));
    setState({ files: newFiles });
    // Invalidate cache and refetch so the list reflects Drive's truth
    if (currentFolderId) {
      const newCache = new Map(folderCache);
      newCache.delete(currentFolderId);
      const newStale = new Set(getState().staleFolderIds);
      newStale.delete(currentFolderId);
      saveCacheToStorage(newCache);
      setState({ folderCache: newCache, staleFolderIds: newStale });
      await getState().refreshFiles(accessToken);
    }
  },
}));
