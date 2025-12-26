#!/bin/bash
# Vercel 快取清除腳本

echo "正在清除 Vercel 快取..."

# 檢查 Vercel CLI
if command -v vercel &> /dev/null; then
    echo "使用 Vercel CLI 清除快取並重新部署..."
    vercel --prod --force
else
    echo "Vercel CLI 未安裝"
    echo ""
    echo "請在 Vercel Dashboard 手動清除快取："
    echo "1. 前往: https://vercel.com/anatomy-quiz-pwas-projects/rungait-pro/deployments"
    echo "2. 點擊最新部署的 '...' → 'Redeploy'"
    echo "3. 勾選 'Clear build cache and redeploy'"
    echo "4. 點擊 'Redeploy'"
fi
