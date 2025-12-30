# 版本對齊檢查指南

## 快速檢查命令

### 1. 添加夥伴的 Remote（首次設定）

```bash
cd running-gait/fullstack/frontend
git remote add partner https://github.com/Archiken/sun-frontend.git
git fetch partner
```

### 2. 檢查版本差異

```bash
# 比較 package.json
git diff main partner/main -- package.json

# 比較所有檔案
git diff main partner/main --stat

# 查看夥伴的最新 commits
git log partner/main --oneline -10
```

### 3. 檢查關鍵版本

```bash
# 查看當前版本
cat package.json | grep -E '"next"|"react"|"typescript"'

# 查看夥伴的版本
git show partner/main:package.json | grep -E '"next"|"react"|"typescript"'
```

## 版本對齊清單

### 必須對齊的版本

- [ ] **Next.js**: 當前 `16.1.1` vs 夥伴版本 `?`
- [ ] **React**: 當前 `19.2.3` vs 夥伴版本 `?`
- [ ] **TypeScript**: 當前 `^5` vs 夥伴版本 `?`
- [ ] **Node.js**: 當前 `pnpm@10.0.0` vs 夥伴版本 `?`

### 建議對齊的版本

- [ ] `@supabase/supabase-js`
- [ ] `@supabase/ssr`
- [ ] `@react-google-maps/api`
- [ ] `tailwindcss`
- [ ] `@radix-ui/*` 套件

## 相容性檢查

### Next.js 16.1.1 相容性

- ✅ React 19.2.3（支援）
- ✅ TypeScript 5（支援）
- ✅ App Router（支援）

### 如果版本不一致

1. **Next.js 版本不同**：
   - 檢查 [Next.js 升級指南](https://nextjs.org/docs/app/building-your-application/upgrading)
   - 測試所有功能是否正常

2. **React 版本不同**：
   - React 19 是較新版本
   - 如果夥伴使用 React 18，需要測試相容性

3. **TypeScript 版本不同**：
   - TypeScript 5 是較新版本
   - 通常向後相容，但需檢查類型錯誤

## 自動檢查腳本

執行 `./sync-partner.sh` 會自動：
1. 拉取夥伴的更新
2. 顯示新 commits
3. 比較 package.json
4. 詢問是否合併

## 定期檢查建議

- **每日**: 檢查是否有新更新
- **每週**: 同步功能更新
- **每月**: 檢查版本對齊

