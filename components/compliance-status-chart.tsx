"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { ComplianceDocument } from "@/lib/types";

interface ComplianceStatusChartProps {
  documents: ComplianceDocument[];
}

export function ComplianceStatusChart({ documents }: ComplianceStatusChartProps) {
  const typeMap: Record<string, { compliant: number; nonCompliant: number }> = {};

  for (const doc of documents) {
    if (!typeMap[doc.document_type]) {
      typeMap[doc.document_type] = { compliant: 0, nonCompliant: 0 };
    }
    if (doc.status === "COMPLIANT") {
      typeMap[doc.document_type].compliant++;
    } else {
      typeMap[doc.document_type].nonCompliant++;
    }
  }

  const data = Object.entries(typeMap).map(([type, counts]) => ({
    name: type.charAt(0) + type.slice(1).toLowerCase(),
    Compliant: counts.compliant,
    "Non-Compliant": counts.nonCompliant,
  }));

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          Compliance by Document Type
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={4}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(217, 20%, 14%)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "hsl(215, 20%, 55%)" }}
                axisLine={{ stroke: "hsl(217, 20%, 14%)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(215, 20%, 55%)" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(220, 20%, 7%)",
                  border: "1px solid hsl(217, 20%, 14%)",
                  borderRadius: "8px",
                  color: "hsl(210, 40%, 96%)",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="Compliant"
                fill="hsl(142, 71%, 45%)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="Non-Compliant"
                fill="hsl(0, 84%, 60%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
