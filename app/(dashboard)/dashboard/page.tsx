"use client";

import { useMemo, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { safeGetDecisions } from "@/lib/api";
import { KPICard } from "@/components/kpi-card";
import { RiskDistributionChart } from "@/components/risk-distribution-chart";
import { ComplianceStatusChart } from "@/components/compliance-status-chart";
import { RecentActivity } from "@/components/recent-activity";
import {
  FileText,
  AlertTriangle,
  ShieldCheck,
  Activity,
  ShieldAlert,
  ScanSearch,
  BarChart3,
  Sparkles
} from "lucide-react";

import type { DashboardKPIs } from "@/lib/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await safeGetDecisions({ limit: 100 });
        setDocuments(res?.data ?? []);
      } catch (e) {
        console.error("Failed to load dashboard documents", e);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const kpis: DashboardKPIs = useMemo(() => {
    const totalDocuments = documents.length;

    const highRiskCount = documents.filter((d) => d.risk_level === "HIGH").length;
    const mediumRiskCount = documents.filter((d) => d.risk_level === "MEDIUM").length;
    const lowRiskCount = documents.filter((d) => d.risk_level === "LOW").length;

    const compliantCount = documents.filter((d) => d.status === "COMPLIANT").length;
    const nonCompliantCount = documents.filter((d) => d.status === "NON_COMPLIANT").length;

    const piiDocuments = documents.filter(
      (d) => d.explanation && String(d.explanation).toLowerCase().includes("pii")
    ).length;

    const avgConfidence =
      totalDocuments > 0
        ? documents.reduce((sum, d) => sum + (d.confidence || 0), 0) / totalDocuments
        : 0;

    return {
      totalDocuments,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      avgConfidence,
      compliantCount,
      nonCompliantCount,
      piiDocuments,
    };
  }, [documents]);

  return (
    <div className="flex flex-col gap-8 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary"/>
            Compliance Intelligence
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            AI-powered enterprise document risk monitoring
          </p>

          <p className="text-xs text-muted-foreground mt-1">
            Welcome back, {user?.username || "User"}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BarChart3 className="w-4 h-4"/>
          {documents.length} documents analyzed
        </div>

      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

        <KPICard
          title="Documents Processed"
          value={kpis.totalDocuments}
          subtitle={`${kpis.compliantCount} compliant • ${kpis.nonCompliantCount} flagged`}
          icon={FileText}
          accentColor="text-primary"
        />

        <KPICard
          title="High Risk Documents"
          value={kpis.highRiskCount}
          subtitle="Immediate attention required"
          icon={AlertTriangle}
          accentColor="text-destructive"
        />

        <KPICard
          title="Medium Risk"
          value={kpis.mediumRiskCount}
          subtitle="Potential compliance concerns"
          icon={ShieldAlert}
          accentColor="text-amber-500"
        />

        <KPICard
          title="Low Risk"
          value={kpis.lowRiskCount}
          subtitle="Within acceptable tolerance"
          icon={ShieldCheck}
          accentColor="text-emerald-500"
        />

        <KPICard
          title="PII Exposure"
          value={kpis.piiDocuments}
          subtitle="Sensitive data detected"
          icon={ScanSearch}
          accentColor="text-destructive"
        />

        <KPICard
          title="AI Confidence"
          value={`${(kpis.avgConfidence * 100).toFixed(1)}%`}
          subtitle="Average model certainty"
          icon={Activity}
          accentColor="text-primary"
        />

      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        <div className="bg-muted/30 rounded-xl border p-4">
          <RiskDistributionChart
            highRisk={kpis.highRiskCount}
            mediumRisk={kpis.mediumRiskCount}
            lowRisk={kpis.lowRiskCount}
          />
        </div>

        <div className="bg-muted/30 rounded-xl border p-4">
          <ComplianceStatusChart documents={documents} />
        </div>

      </div>

      {/* ACTIVITY FEED */}
      <div className="bg-muted/20 border rounded-xl p-4">
        <RecentActivity documents={documents} />
      </div>

    </div>
  );
}