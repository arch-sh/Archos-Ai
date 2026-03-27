"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

import { AlertTriangle } from "lucide-react";

interface RiskDistributionChartProps {
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
}

export function RiskDistributionChart({
  highRisk,
  mediumRisk,
  lowRisk,
}: RiskDistributionChartProps) {

  const data = [
    { name: "High Risk", value: highRisk, color: "#ef4444" },
    { name: "Medium Risk", value: mediumRisk, color: "#f59e0b" },
    { name: "Low Risk", value: lowRisk, color: "#22c55e" },
  ];

  return (
    <Card className="border-none shadow-none">

      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle className="w-4 h-4 text-destructive"/>
          Document Risk Distribution
        </CardTitle>
      </CardHeader>

      <CardContent>

        <div className="h-64">

          <ResponsiveContainer width="100%" height="100%">

            <PieChart>

              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={4}
                dataKey="value"
              >

                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}

              </Pie>

              <Tooltip />

              <Legend />

            </PieChart>

          </ResponsiveContainer>

        </div>

      </CardContent>

    </Card>
  );
}