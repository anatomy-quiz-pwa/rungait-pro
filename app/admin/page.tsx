"use client"

import { AdminKPI } from "@/components/admin/admin-kpi"
import { StudentsTable } from "@/components/admin/students-table"
import { AnalyticsCharts } from "@/components/admin/analytics-charts"
import { MapManager } from "@/components/admin/map-manager"
import { Users, Activity, DollarSign, Zap } from "lucide-react"
import { getMockSystemKPI, getMockBillingEvents } from "@/lib/admin-mock-data"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"

export default function AdminOverview() {
  const kpi = getMockSystemKPI()
  const recentEvents = getMockBillingEvents().slice(0, 10)
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-100">Admin Dashboard</h2>
        <p className="text-slate-400 mt-1">System performance and management</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="students" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
            Student Analytics
          </TabsTrigger>
          <TabsTrigger value="map" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
            Map Manager
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AdminKPI
              title="Total Users"
              value={kpi.totalUsers}
              subtitle={`${kpi.activeUsers} active`}
              icon={Users}
              trend="up"
              trendValue="+12% this month"
            />
            <AdminKPI
              title="Analyses This Month"
              value={kpi.analysesThisMonth}
              subtitle={`${kpi.totalAnalyses} total`}
              icon={Activity}
              trend="up"
              trendValue="+8% vs last month"
            />
            <AdminKPI
              title="Revenue This Month"
              value={`NT$ ${kpi.revenueThisMonth.toLocaleString()}`}
              subtitle="All plans combined"
              icon={DollarSign}
              trend="up"
              trendValue="+24% growth"
            />
            <AdminKPI
              title="Webhook Status"
              value={kpi.webhookSyncStatus === "healthy" ? "Healthy" : "Warning"}
              subtitle="Stripe sync"
              icon={Zap}
              trend="neutral"
              trendValue="Last sync: 2 min ago"
            />
          </div>

          <Card className="p-6 bg-slate-900/50 border-slate-800">
            <h3 className="text-xl font-semibold text-slate-100 mb-4">Recent Webhook Events</h3>
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-950 border border-slate-800"
                >
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
                      {event.stripe_event_id || "Local event"} • User: {event.user_id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-200">
                      {event.amount.toLocaleString()} {event.currency}
                    </p>
                    <p className="text-xs text-slate-500">{new Date(event.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <AnalyticsCharts />
          <StudentsTable />
        </TabsContent>

        <TabsContent value="map" className="space-y-6">
          <MapManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
