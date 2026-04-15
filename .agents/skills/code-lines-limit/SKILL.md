---
name: code-lines-limit
description: Enforces a maximum of 300 lines per TypeScript and TSX source file. Apply when writing, reviewing, or refactoring code to keep modules small, testable, and maintainable.
license: MIT
metadata:
  author: explooosion
  version: "2.0.0"
---

# Code Lines Limit

Mandatory file size limit for all TypeScript source files in this repository.

## When to Apply

Apply **before completing any code edit**, including:

- Writing new components or pages
- Adding features to existing files
- Refactoring or reviewing code
- Any file modification that may increase line count

---

## Core Rule

**Single file maximum: 300 lines**

No TypeScript or TSX source file (`.ts`, `.tsx`) may exceed **300 lines of code**.

When a page/component file (for example `xxx.tsx`) becomes too large and the extracted logic is not shared, you must convert it to a directory entry pattern:

1. Create a sibling directory named `xxx/`
2. Move `xxx.tsx` into that directory and rename it to `index.tsx`
3. Continue extraction inside `xxx/components/`, `xxx/hooks/`, and `xxx/utils/`

For integration-heavy logic, extract and organize by service domain under `src/services/`.

---

## Enforcement Strategy

When a file approaches or exceeds 300 lines, apply the following refactoring strategies in order:

### 1. Extract Components

Break down large components into smaller, focused sub-components.

**Location Strategy:**

- **Multi-page reuse:** Place in `src/components/`
- **Single-component use:** Convert parent file into `xxx/index.tsx`, then create local `xxx/components/`

**Example:**

```tsx
// ❌ Before: album_page.tsx (350 lines)
export function AlbumPage() {
  return (
    <div>
      {/* 100+ lines of header UI */}
      {/* 100+ lines of gallery grid */}
      {/* 100+ lines of upload form */}
    </div>
  );
}

// ✅ After: pages/album_page/index.tsx (100 lines)
import { AlbumHeader } from './components/album_header';
import { AlbumGallery } from './components/album_gallery';
import { AlbumUploadForm } from './components/album_upload_form';

export function AlbumPage() {
  return (
    <div>
      <AlbumHeader />
      <AlbumGallery />
      <AlbumUploadForm />
    </div>
  );
}
```

### 2. Extract Custom Hooks

Move complex state management or side effects into custom hooks.

**Location Strategy:**

- **Multi-page reuse:** Place in `src/hooks/`
- **Single-component use:** Convert parent file into `xxx/index.tsx`, then create local `xxx/hooks/`

**Example:**

```tsx
// ❌ Before: gallery_view.tsx (320 lines)
export function GalleryView() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // 50+ lines of data fetching logic
  }, []);
  
  const handleUpload = () => {
    // 30+ lines of upload logic
  };
  
  const handleDelete = () => {
    // 30+ lines of delete logic
  };
  
  // ... more code
}

// ✅ After: pages/gallery_view/index.tsx (150 lines)
import { useGalleryData } from './hooks/use_gallery_data';

export function GalleryView() {
  const { images, loading, error, handleUpload, handleDelete } = useGalleryData();
  
  // Clean render logic only
}

// ✅ New file: pages/gallery_view/hooks/use_gallery_data.ts (120 lines)
export function useGalleryData() {
  // All data fetching and management logic
}
```

### 3. Extract Utility Functions

Move pure functions and helpers into utility modules.

**Location Strategy:**

- **Multi-page reuse:** Place in `src/utils/`
- **Single-component use:** Convert parent file into `xxx/index.tsx`, then create local `xxx/utils/`

**Example:**

```tsx
// ❌ Before: album_page.tsx (310 lines)
export function AlbumPage() {
  const formatDate = (date: Date) => {
    // 20 lines of formatting logic
  };
  
  const validateAlbumName = (name: string) => {
    // 15 lines of validation logic
  };
  
  const calculateImageDimensions = () => {
    // 25 lines of calculation
  };
  
  // ... component logic
}

// ✅ After: pages/album_page/index.tsx (200 lines)
import { formatDate, validateAlbumName, calculateImageDimensions } from './utils/album_helpers';

export function AlbumPage() {
  // Clean component logic
}

// ✅ New file: pages/album_page/utils/album_helpers.ts (80 lines)
export function formatDate(date: Date) { /* ... */ }
export function validateAlbumName(name: string) { /* ... */ }
export function calculateImageDimensions() { /* ... */ }
```

### 4. Extract Integration Services

Move platform integration logic into service modules by domain.

**Location Strategy:**

- **Storage operations:** Place in `src/services/storage/`
- **Authentication operations:** Place in `src/services/auth/`
- **Cross-file service API:** Expose via each service directory `index.ts`

**Example:**

```ts
// ✅ Service domain barrel
// src/services/storage/index.ts
export {
  listItems,
  createItem,
  uploadItem,
} from "../../utils/storage_api";
```

---

## Directory Structure Patterns

### For Shared Code (Multiple Pages/Components)

```
src/
  components/      ← Shared components
  hooks/           ← Shared custom hooks
  utils/           ← Shared utility functions
  pages/
    album_page/
      index.tsx
    login_page.tsx
```

### For Local Code (Single Component Only)

```
src/
  pages/
    album_page/
      index.tsx
      components/  ← Local sub-components
        album_header.tsx
        album_gallery.tsx
      hooks/       ← Local hooks
        use_gallery_data.ts
      utils/       ← Local utilities
        album_helpers.ts
  services/
    storage/      ← Storage integration services
      index.ts
    auth/         ← Authentication integration services
      index.ts
```

---

## Validation Checklist

Before marking a code edit as complete:

- [ ] Count total lines in the modified file
- [ ] If > 300 lines, identify extraction candidates
- [ ] For non-shared extraction, convert `xxx.tsx` to `xxx/index.tsx` first
- [ ] Extract components, hooks, or utils using the location strategy above
- [ ] For integration logic, organize by domain under `src/services/`
- [ ] Ensure the original file is now ≤ 300 lines
- [ ] Update imports in affected files
- [ ] Verify all extracted files follow `file-naming-convention` skill (lowercase snake_case)

---

## Exemptions

The following files are **exempt** from this rule:

- Configuration files (`vite.config.ts`, `eslint.config.js`, etc.)
- Type definition aggregation files (`types/index.ts`)
- Auto-generated files

---

## Rationale

**Benefits of 300-line limit:**

1. **Readability:** Smaller files are easier to understand and navigate
2. **Maintainability:** Focused files have single responsibilities
3. **Testability:** Extracted hooks and utils are easier to unit test
4. **Reusability:** Decomposed code promotes code reuse
5. **Code Review:** Smaller files make reviews more effective
6. **Performance:** Encourages better component boundaries and memoization opportunities

---

## Automation Hint

To check all files in the repository:

```bash
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec wc -l {} \; | awk '$1 > 300 {print}'
```

This command outputs any source file exceeding 300 lines.
