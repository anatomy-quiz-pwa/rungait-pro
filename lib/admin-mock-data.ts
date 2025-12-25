import type { AdminUser, BillingPlan, BillingEvent, UsageAnalysis, ApiToken, LiteratureNorm, SystemKPI } from "./types"

// Mock data for admin functionality
export function getMockAdminUsers(): AdminUser[] {
  return [
    {
      id: "admin_1",
      email: "admin@example.com",
      role: "admin",
      plan_id: "pro",
      monthly_quota: 200,
      credits_extra: 50,
      used_this_month: 45,
      created_at: "2025-01-15T10:00:00Z",
    },
    {
      id: "user_1",
      email: "runner@example.com",
      role: "user",
      plan_id: "starter",
      monthly_quota: 20,
      credits_extra: 5,
      used_this_month: 12,
      created_at: "2025-02-20T14:30:00Z",
    },
    {
      id: "user_2",
      email: "coach@example.com",
      role: "user",
      plan_id: "pro",
      monthly_quota: 200,
      credits_extra: 0,
      used_this_month: 87,
      created_at: "2025-01-10T09:15:00Z",
    },
  ]
}

export function getMockBillingPlans(): BillingPlan[] {
  return [
    {
      id: "free",
      name: "Free",
      name_zh: "免費版",
      quota: 5,
      price: 0,
      currency: "TWD",
      features: ["5 analyses/month", "Basic reports", "Community support"],
    },
    {
      id: "starter",
      name: "Starter",
      name_zh: "入門版",
      quota: 20,
      price: 990,
      currency: "TWD",
      stripe_price_id: "price_starter_monthly",
      features: ["20 analyses/month", "Full reports", "Email support", "Before/after comparison"],
    },
    {
      id: "pro",
      name: "Professional",
      name_zh: "專業版",
      quota: 200,
      price: 4990,
      currency: "TWD",
      stripe_price_id: "price_pro_monthly",
      features: ["200 analyses/month", "Advanced reports", "Priority support", "API access", "Team sharing"],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      name_zh: "企業版",
      quota: 99999,
      price: 19900,
      currency: "TWD",
      stripe_price_id: "price_enterprise_monthly",
      features: [
        "Unlimited analyses",
        "Custom integrations",
        "Dedicated support",
        "White-label options",
        "Custom models",
      ],
    },
  ]
}

export function getMockBillingEvents(): BillingEvent[] {
  return [
    {
      id: "evt_1",
      stripe_event_id: "evt_stripe_123",
      event_type: "checkout.session.completed",
      user_id: "user_2",
      amount: 4990,
      currency: "TWD",
      status: "success",
      created_at: "2025-11-01T10:00:00Z",
    },
    {
      id: "evt_2",
      stripe_event_id: "evt_stripe_124",
      event_type: "invoice.payment_succeeded",
      user_id: "user_1",
      amount: 990,
      currency: "TWD",
      status: "success",
      created_at: "2025-11-05T14:30:00Z",
    },
    {
      id: "evt_3",
      event_type: "invoice.payment_failed",
      user_id: "user_3",
      amount: 990,
      currency: "TWD",
      status: "failed",
      created_at: "2025-11-06T09:15:00Z",
    },
  ]
}

export function getMockUsageAnalyses(): UsageAnalysis[] {
  return [
    {
      id: "usage_1",
      user_id: "user_1",
      analysis_id: "analysis_001",
      cost: 1,
      metadata: { filename: "runner_video.mp4", size: 15000000 },
      created_at: "2025-11-07T10:00:00Z",
    },
    {
      id: "usage_2",
      user_id: "user_2",
      analysis_id: "analysis_002",
      cost: 1,
      metadata: { filename: "gait_test.mp4", size: 12000000 },
      created_at: "2025-11-07T14:30:00Z",
    },
  ]
}

export function getMockApiTokens(): ApiToken[] {
  return [
    {
      id: "token_1",
      user_id: "user_2",
      token_hash: "sha256_hash_abc123...",
      scope: "read",
      expires_at: "2026-11-07T00:00:00Z",
      revoked: false,
      created_at: "2025-10-01T10:00:00Z",
      last_used: "2025-11-06T15:30:00Z",
    },
    {
      id: "token_2",
      user_id: "admin_1",
      token_hash: "sha256_hash_def456...",
      scope: "admin",
      expires_at: "2026-11-07T00:00:00Z",
      revoked: false,
      created_at: "2025-09-15T09:00:00Z",
      last_used: "2025-11-07T08:00:00Z",
    },
  ]
}

export function getMockLiteratureNorms(): LiteratureNorm[] {
  return [
    {
      id: "lit_1",
      phase: "MS",
      joint: "knee",
      min_value: 15,
      max_value: 25,
      units: "deg",
      author: "Novacheck TF",
      year: 1998,
      title: "The biomechanics of running",
      journal: "Gait & Posture",
      doi: "10.1016/S0966-6362(97)00038-6",
      note: "Classic reference for normal running gait patterns in healthy adults.",
      created_at: "2025-01-10T00:00:00Z",
    },
    {
      id: "lit_2",
      phase: "IC",
      joint: "ankle",
      min_value: -5,
      max_value: 5,
      units: "deg",
      author: "Dugan SA, Bhat KP",
      year: 2005,
      title: "Biomechanics and analysis of running gait",
      journal: "Phys Med Rehabil Clin N Am",
      doi: "10.1016/j.pmr.2005.02.007",
      created_at: "2025-01-11T00:00:00Z",
    },
    {
      id: "lit_3",
      phase: "TSw",
      joint: "hip",
      min_value: 30,
      max_value: 45,
      units: "deg",
      author: "Schache AG, et al.",
      year: 2011,
      title: "Lower limb joint mechanics in running",
      journal: "Journal of Biomechanics",
      doi: "10.1016/j.jbiomech.2010.11.024",
      note: "Comprehensive 3D kinematic analysis during running at various speeds.",
      created_at: "2025-01-12T00:00:00Z",
    },
  ]
}

export function getMockSystemKPI(): SystemKPI {
  return {
    totalUsers: 1247,
    activeUsers: 523,
    totalAnalyses: 8932,
    analysesThisMonth: 412,
    revenueThisMonth: 123450,
    webhookSyncStatus: "healthy",
  }
}
