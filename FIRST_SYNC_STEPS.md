# 首次同步步驟

## 前置需求

### 1. 確認權限

夥伴的 repo (`Archiken/sun-frontend`) 是 **Private**，你需要：

1. **請夥伴將你加入 Collaborators**：
   - 前往 GitHub repo Settings > Collaborators
   - 添加你的 GitHub 帳號
   - 給予 Read 權限（至少）

2. **或使用 Personal Access Token**：
   - 請夥伴生成一個有 repo 權限的 token
   - 使用 token 進行認證

### 2. 設定認證

如果 repo 是 private，需要認證：

```bash
# 方法 1: 使用 SSH（推薦）
git remote set-url partner git@github.com:Archiken/sun-frontend.git

# 方法 2: 使用 HTTPS + Personal Access Token
git remote set-url partner https://<token>@github.com/Archiken/sun-frontend.git
```

## 首次同步流程

### 步驟 1: 添加 Remote

```bash
cd running-gait/fullstack/frontend

# 如果尚未添加
git remote add partner https://github.com/Archiken/sun-frontend.git

# 確認
git remote -v
```

### 步驟 2: 拉取夥伴的更新

```bash
git fetch partner
```

如果失敗，可能是：
- 權限問題（需要加入 Collaborators）
- 認證問題（需要使用 token 或 SSH）

### 步驟 3: 檢查更新

```bash
# 查看夥伴的最新 commits
git log partner/main --oneline -10

# 查看版本差異
git diff main partner/main -- package.json

# 查看所有檔案差異
git diff main partner/main --stat
```

### 步驟 4: 比較關鍵版本

```bash
# 查看當前版本
echo "=== 當前版本 ==="
cat package.json | grep -E '"next"|"react"|"typescript"|"packageManager"'

# 查看夥伴的版本
echo "=== 夥伴版本 ==="
git show partner/main:package.json | grep -E '"next"|"react"|"typescript"|"packageManager"'
```

### 步驟 5: 決定同步策略

根據版本差異決定：

1. **版本相同**：直接合併
2. **版本不同但相容**：合併後測試
3. **版本不同且不相容**：先討論統一版本

### 步驟 6: 執行同步

```bash
# 使用自動化腳本（推薦）
./sync-partner.sh

# 或手動合併
git merge partner/main
```

## 當前版本資訊

- **Next.js**: `16.1.1`
- **React**: `19.2.3`
- **TypeScript**: `^5`
- **Package Manager**: `pnpm@10.0.0`

## 常見問題

### Q: "Permission denied" 錯誤

A: 需要請夥伴將你加入 Collaborators，或使用 Personal Access Token。

### Q: "Repository not found" 錯誤

A: 確認 repo 名稱和 URL 是否正確。

### Q: 如何取得 Personal Access Token？

A: 
1. GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Generate new token
3. 選擇 `repo` 權限
4. 使用 token 作為密碼

### Q: 版本衝突怎麼辦？

A: 
1. 先比較兩個版本的差異
2. 測試新版本是否相容
3. 如果相容，統一使用較新版本
4. 如果不相容，討論決定使用哪個版本

## 下一步

1. ✅ 確認權限（請夥伴加入 Collaborators）
2. ✅ 執行首次 fetch
3. ✅ 比較版本
4. ✅ 決定同步策略
5. ✅ 建立定期同步流程

