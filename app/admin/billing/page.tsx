"use client"

import { getMockBillingPlans, getMockBillingEvents } from "@/lib/admin-mock-data"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, CheckCircle2, XCircle } from "lucide-react"

export default function AdminBillingPage() {
  const plans = getMockBillingPlans()
  const events = getMockBillingEvents()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-100">Billing</h2>
          <p className="text-slate-400 mt-1">Manage plans and payment events</p>
        </div>
        <Button className="gap-2 bg-cyan-600 hover:bg-cyan-700">
          <Plus className="h-4 w-4" />
          Add Plan
        </Button>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-slate-100 mb-4">Subscription Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="p-6 bg-slate-900/50 border-slate-800">
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-slate-100">{plan.name}</h4>
                  <p className="text-sm text-slate-400">{plan.name_zh}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-cyan-400">
                    {plan.price === 0 ? "Free" : `NT$ ${plan.price.toLocaleString()}`}
                  </span>
                  {plan.price > 0 && <span className="text-slate-500 text-sm">/month</span>}
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold">{plan.quota}</span> analyses/month
                  </p>
                  {plan.stripe_price_id && <p className="text-xs text-slate-500 font-mono">{plan.stripe_price_id}</p>}
                </div>
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  Edit Plan
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-slate-100 mb-4">Recent Payment Events</h3>
        <Card className="p-6 bg-slate-900/50 border-slate-800">
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 rounded-lg bg-slate-950 border border-slate-800"
              >
                <div className="flex items-center gap-4">
                  {event.status === "success" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400" />
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-200">{event.event_type}</span>
                      <Badge
                        variant={event.status === "success" ? "default" : "destructive"}
                        className={event.status === "success" ? "bg-green-500/10 text-green-400" : ""}
                      >
                        {event.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      {event.stripe_event_id || "No Stripe ID"} • {event.user_id}
                    </p>
                    <p className="text-xs text-slate-500">{new Date(event.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-slate-200">
                    {event.amount.toLocaleString()} {event.currency}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
