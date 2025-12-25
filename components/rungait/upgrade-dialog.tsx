"use client"

interface UsageInfo {
  used: number
  quota: number
  extra: number
}

interface UpgradeDialogProps {
  open: boolean
  onClose: () => void
  usage: UsageInfo
  onCheckoutStarter: () => void
  onCheckoutPro: () => void
  onBuyCredits: () => void
}

export function UpgradeDialog({
  open,
  onClose,
  usage,
  onCheckoutStarter,
  onCheckoutPro,
  onBuyCredits,
}: UpgradeDialogProps) {
  if (!open) return null

  const total = usage.quota + usage.extra

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-2xl bg-[#0B0F12] text-slate-100 border border-white/10 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-balance">升級以繼續影片分析</h2>
            <p className="text-sm text-slate-400 mt-2">
              你本月已使用 <span className="font-semibold text-cyan-400">{usage.used}</span> / {total}{" "}
              次。已達目前方案上限。
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl leading-none p-1"
            aria-label="關閉"
          >
            ✕
          </button>
        </div>

        {/* Plans Grid */}
        <div className="p-6 grid md:grid-cols-3 gap-4">
          {/* Free Plan */}
          <PlanCard
            title="Free（目前）"
            price="NT$ 0"
            period="/ 月"
            features={["每月 5 次", "文獻對照 & AI 小結", "報告匯出 (PDF/CSV)"]}
            disabled
            ctaText="目前方案"
          />

          {/* Starter Plan */}
          <PlanCard
            highlight
            title="Starter（建議）"
            price="NT$ 390"
            period="/ 月"
            features={["每月 30 次", "前後比較 / Phase×Joint 矩陣", "私人雲端保存", "電子收據"]}
            ctaText="立即升級"
            onClick={onCheckoutStarter}
          />

          {/* Pro Plan */}
          <PlanCard
            title="Pro（教練/診所）"
            price="NT$ 1,990"
            period="/ 月"
            features={["每月 200 次", "多使用者管理", "自訂文獻庫 & Norms 版本", "API 權杖"]}
            ctaText="立即升級"
            onClick={onCheckoutPro}
          />
        </div>

        {/* Credits Section */}
        <div className="px-6 pb-6">
          <div className="rounded-xl border border-white/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/5">
            <div>
              <div className="font-semibold text-lg">Credits（一次性）</div>
              <p className="text-sm text-slate-400 mt-1">加購 20 次（90 天內使用）</p>
            </div>
            <button
              onClick={onBuyCredits}
              className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-medium transition-colors whitespace-nowrap"
            >
              NT$ 490 / 次數包
            </button>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-slate-500 mt-4 leading-relaxed">
            升級後立即生效；費用按月計（可隨時取消）。企業版請聯繫我們：support@yourbrand.com
          </p>
        </div>

        {/* Close Button */}
        <div className="px-6 pb-6 flex justify-end border-t border-white/10 pt-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
          >
            稍後再說
          </button>
        </div>
      </div>
    </div>
  )
}

interface PlanCardProps {
  title: string
  price: string
  period: string
  features: string[]
  ctaText: string
  onClick?: () => void
  disabled?: boolean
  highlight?: boolean
}

function PlanCard({ title, price, period, features, ctaText, onClick, disabled, highlight }: PlanCardProps) {
  return (
    <div
      className={`rounded-xl p-5 border flex flex-col transition-all ${
        highlight
          ? "border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/20 shadow-lg shadow-cyan-500/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div className="font-semibold text-lg">{title}</div>
      <div className="mt-3 mb-1">
        <span className="text-2xl font-bold">{price}</span>
        <span className="text-sm text-slate-400 ml-1">{period}</span>
      </div>

      <ul className="text-sm text-slate-300 space-y-2 mt-4 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-cyan-400 mt-0.5">•</span>
            <span className="text-balance">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        disabled={disabled}
        onClick={onClick}
        className={`mt-5 w-full px-4 py-2.5 rounded-lg font-medium transition-all ${
          disabled
            ? "bg-white/10 text-slate-400 cursor-not-allowed"
            : highlight
              ? "bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/20"
              : "bg-cyan-500/80 hover:bg-cyan-500 text-white"
        }`}
      >
        {ctaText}
      </button>
    </div>
  )
}
