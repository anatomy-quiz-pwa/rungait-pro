# 專案同步策略

## 目標

1. ✅ 確認夥伴的更新內容
2. ✅ 定期同步更新
3. ✅ 讓夥伴的功能在 Vercel 部署可見
4. ✅ 版本和程式對齊，避免相容性問題

## 夥伴的 Repository 資訊

- **Repository**: `Archiken / sun-frontend` (Private)
- **部署 URL**: `sun-frontend-eta.vercel.app`
- **最新 Commit**: "左右2:3" (1 hour ago)
- **總 Commits**: 76 commits

## 當前專案資訊

- **Repository**: `anatomy-quiz-pwa/rungait-pro`
- **部署 URL**: `rungait-4jho7u7ef-anatomy-quiz-pwas-projects.vercel.app`
- **Next.js 版本**: 16.1.1
- **React 版本**: 19.2.3

## 同步策略

### 方案 1：使用 Git Remote（推薦）

將夥伴的 repo 添加為 remote，定期拉取更新：

```bash
# 1. 添加夥伴的 repo 為 upstream
cd running-gait/fullstack/frontend
git remote add partner https://github.com/Archiken/sun-frontend.git

# 2. 查看所有 remotes
git remote -v

# 3. 拉取夥伴的更新（不自動合併）
git fetch partner

# 4. 查看夥伴的更新內容
git log partner/main --oneline -10

# 5. 比較差異
git diff main partner/main

# 6. 合併特定分支或 commit
git merge partner/main --no-commit
# 或
git cherry-pick <commit-hash>
```

### 方案 2：定期手動同步

1. **檢查版本差異**：
   ```bash
   # 比較 package.json
   git fetch partner
   git diff main partner/main -- package.json
   ```

2. **檢查依賴版本**：
   - Next.js 版本
   - React 版本
   - 其他關鍵依賴

3. **合併更新**：
   ```bash
   git merge partner/main
   # 解決衝突後
   git push
   ```

### 方案 3：使用 GitHub Actions 自動同步

建立自動化工作流程（需要夥伴 repo 的 access token）。

## 版本對齊檢查清單

### 核心依賴

- [ ] Next.js 版本
- [ ] React 版本
- [ ] TypeScript 版本
- [ ] Node.js 版本（packageManager）

### 關鍵套件

- [ ] @supabase/supabase-js
- [ ] @supabase/ssr
- [ ] @react-google-maps/api
- [ ] tailwindcss
- [ ] 其他共享依賴

### 配置檔案

- [ ] `next.config.ts` / `next.config.mjs`
- [ ] `tsconfig.json`
- [ ] `tailwind.config.js`
- [ ] `.env.local` (環境變數結構)

## 同步流程

### 每日檢查（建議）

```bash
# 1. 檢查夥伴是否有新更新
git fetch partner
git log main..partner/main --oneline

# 2. 如果有更新，查看差異
git diff main partner/main

# 3. 決定是否合併
```

### 每週同步（建議）

```bash
# 1. 確保本地是最新的
git pull origin main

# 2. 拉取夥伴的更新
git fetch partner

# 3. 比較版本
git diff main partner/main -- package.json

# 4. 如果有版本差異，先討論再合併
# 5. 合併功能更新
git merge partner/main

# 6. 解決衝突
# 7. 測試
pnpm install
pnpm run build

# 8. 提交並推送
git push origin main
```

## 衝突解決策略

### 1. 版本衝突

如果 `package.json` 有版本差異：
- **優先使用較新版本**（但需測試相容性）
- **或統一使用特定版本**（需雙方同意）

### 2. 功能衝突

如果功能有衝突：
- 使用 `git merge` 手動解決
- 保留雙方功能，避免覆蓋
- 必要時重構代碼

### 3. 配置衝突

如果配置檔案衝突：
- 合併雙方配置
- 測試確保功能正常

## 測試流程

每次同步後：

```bash
# 1. 安裝依賴
pnpm install

# 2. 檢查類型
pnpm run lint

# 3. 構建測試
pnpm run build

# 4. 本地測試（如果可能）
pnpm dev
```

## 自動化腳本

建立 `sync-partner.sh`：

```bash
#!/bin/bash
# 同步夥伴的更新

echo "🔄 開始同步夥伴的更新..."

# 1. 拉取夥伴的更新
git fetch partner

# 2. 檢查是否有新更新
if [ -z "$(git log main..partner/main --oneline)" ]; then
    echo "✅ 沒有新更新"
    exit 0
fi

# 3. 顯示新更新
echo "📋 新的更新："
git log main..partner/main --oneline

# 4. 比較 package.json
echo "📦 檢查版本差異："
git diff main partner/main -- package.json

# 5. 詢問是否合併
read -p "是否要合併這些更新？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git merge partner/main
    echo "✅ 合併完成"
else
    echo "❌ 取消合併"
fi
```

## 注意事項

1. **不要直接 force push** 到 main 分支
2. **合併前先測試**，確保功能正常
3. **版本更新需雙方同意**，避免破壞性變更
4. **保留 commit 歷史**，方便追蹤
5. **定期溝通**，避免同時修改相同檔案

## 下一步

1. 添加夥伴的 repo 為 remote
2. 首次同步檢查
3. 建立定期同步流程
4. 設定版本對齊規則

