# 部署資訊

## 雲端部署狀態

✅ **已成功部署到 Vercel**

### 部署網址

- **生產環境**: https://rungait-ii7jr4zuv-anatomy-quiz-pwas-projects.vercel.app
- **專案管理**: https://vercel.com/anatomy-quiz-pwas-projects/rungait-pro

### GitHub Repository

- **Repository**: https://github.com/anatomy-quiz-pwa/rungait-pro
- **分支**: main

## 環境變數設定

在 Vercel Dashboard 設定環境變數：

1. 前往：https://vercel.com/anatomy-quiz-pwas-projects/rungait-pro/settings/environment-variables
2. 新增以下環境變數：

```
NEXT_PUBLIC_API_BASE_URL = (你的後端 API URL)
NEXT_PUBLIC_CDN_URL = (你的 CDN URL)
```

3. 選擇環境（Production / Preview / Development）
4. 重新部署專案

## 功能頁面

- **首頁**: `/`
- **分析頁面**: `/analyze`
- **比較頁面**: `/compare` (待建立)
- **API Mock**: `/api/mock`

## 部署命令

```bash
# 部署到生產環境
vercel --prod

# 部署預覽版本
vercel

# 查看部署日誌
vercel logs

# 重新部署
vercel redeploy
```

## 自動部署

Vercel 已自動連接到 GitHub repository，當你推送變更到 `main` 分支時會自動部署。

