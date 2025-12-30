#!/bin/bash
# 同步夥伴的更新

echo "🔄 開始同步夥伴的更新..."

# 檢查 remote 是否存在
if ! git remote | grep -q "partner"; then
    echo "❌ 尚未添加 partner remote"
    echo "請先執行: git remote add partner https://github.com/Archiken/sun-frontend.git"
    exit 1
fi

# 1. 拉取夥伴的更新
echo "📥 拉取夥伴的更新..."
git fetch partner

# 2. 檢查是否有新更新
NEW_COMMITS=$(git log main..partner/main --oneline)
if [ -z "$NEW_COMMITS" ]; then
    echo "✅ 沒有新更新"
    exit 0
fi

# 3. 顯示新更新
echo "📋 新的更新："
echo "$NEW_COMMITS"
echo ""

# 4. 比較 package.json
echo "📦 檢查版本差異："
PACKAGE_DIFF=$(git diff main partner/main -- package.json)
if [ -n "$PACKAGE_DIFF" ]; then
    echo "$PACKAGE_DIFF"
    echo ""
    echo "⚠️  注意：package.json 有差異，請檢查版本相容性"
else
    echo "✅ package.json 沒有差異"
fi

# 5. 詢問是否合併
read -p "是否要合併這些更新？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 開始合併..."
    git merge partner/main --no-edit
    echo "✅ 合併完成"
    echo "💡 請記得："
    echo "   1. 檢查衝突並解決"
    echo "   2. 執行 pnpm install"
    echo "   3. 執行 pnpm run build 測試"
    echo "   4. 如果一切正常，執行 git push"
else
    echo "❌ 取消合併"
fi
