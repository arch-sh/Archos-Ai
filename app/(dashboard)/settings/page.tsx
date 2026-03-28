// ENTERPRISE SETTINGS PAGE FOR COMPLIANCE PLATFORM
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Server, Shield, Database, FileText, BrainCircuit, Cloud, Activity } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">

      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          Platform Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure infrastructure, compliance pipeline behavior, AI models and system security.
        </p>
      </div>

      {/* Platform Configuration */}
      <Card className="glass-card border border-border bg-card">
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="flex items-center gap-2 text-base text-foreground">
            <Settings className="h-4 w-4 text-primary" />
            Platform Configuration
          </CardTitle>
          <CardDescription>
            Core platform metadata and runtime environment.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 md:px-6 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">

          <div className="rounded-lg bg-secondary/30 px-3 py-2.5">
            <p className="text-xs text-muted-foreground">Platform</p>
            <p className="text-sm font-medium text-foreground">SatyamAI Compliance Platform</p>
          </div>

          <div className="rounded-lg bg-secondary/30 px-3 py-2.5">
            <p className="text-xs text-muted-foreground">Version</p>
            <p className="text-sm font-medium text-foreground">v1.0 Enterprise</p>
          </div>

          <div className="rounded-lg bg-secondary/30 px-3 py-2.5">
            <p className="text-xs text-muted-foreground">Framework</p>
            <p className="text-sm font-medium text-foreground">Next.js 16 (App Router)</p>
          </div>

          <div className="rounded-lg bg-secondary/30 px-3 py-2.5">
            <p className="text-xs text-muted-foreground">Environment</p>
            <p className="text-sm font-medium text-foreground">{process.env.NODE_ENV || "development"}</p>
          </div>

        </CardContent>
      </Card>


      {/* Backend API */}
      <Card className="glass-card border border-border bg-card">
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="flex items-center gap-2 text-base text-foreground">
            <Server className="h-4 w-4 text-primary" />
            Backend API Configuration
          </CardTitle>
          <CardDescription>
            Backend microservices used by the compliance platform.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 md:px-6 flex flex-col gap-4">

          <div className="flex flex-col gap-2">
            <Label className="text-sm">Compliance Store API</Label>
            <Input
              value={process.env.NEXT_PUBLIC_COMPLIANCE_API_URL || "http://127.0.0.1:8003"}
              readOnly
              className="bg-secondary/50 font-mono text-xs md:text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm">Upload Service</Label>
            <Input
              value={process.env.NEXT_PUBLIC_UPLOAD_API_URL || "http://127.0.0.1:8001"}
              readOnly
              className="bg-secondary/50 font-mono text-xs md:text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm">Pipeline Orchestrator</Label>
            <Input
              value={process.env.NEXT_PUBLIC_PIPELINE_API_URL || "http://127.0.0.1:8000"}
              readOnly
              className="bg-secondary/50 font-mono text-xs md:text-sm"
            />
          </div>

        </CardContent>
      </Card>


      {/* Document Processing Pipeline */}
      <Card className="glass-card border border-border bg-card">
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            Document Processing Pipeline
          </CardTitle>
          <CardDescription>
            Stages used to process uploaded documents in the compliance pipeline.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 md:px-6 flex flex-col gap-2">

          {[
            "Document Upload",
            "OCR Extraction",
            "Document Classification",
            "PII Detection",
            "Compliance Rule Evaluation",
            "Risk Scoring",
            "Compliance Storage"
          ].map((stage) => (
            <div key={stage} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2.5">
              <span className="text-sm text-foreground">{stage}</span>
              <Badge variant="outline" className="text-xs">Enabled</Badge>
            </div>
          ))}

        </CardContent>
      </Card>


      {/* AI Models */}
      <Card className="glass-card border border-border bg-card">
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="flex items-center gap-2 text-base">
            <BrainCircuit className="h-4 w-4 text-primary" />
            AI Model Configuration
          </CardTitle>
          <CardDescription>
            Machine learning models used for document classification and compliance analysis.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 md:px-6 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">

          <div className="rounded-lg bg-secondary/30 px-3 py-2.5">
            <p className="text-xs text-muted-foreground">OCR Engine</p>
            <p className="text-sm text-foreground">Google Vision OCR</p>
          </div>

          <div className="rounded-lg bg-secondary/30 px-3 py-2.5">
            <p className="text-xs text-muted-foreground">PII Detection</p>
            <p className="text-sm text-foreground">Regex + NLP Hybrid</p>
          </div>

          <div className="rounded-lg bg-secondary/30 px-3 py-2.5">
            <p className="text-xs text-muted-foreground">Document Classifier</p>
            <p className="text-sm text-foreground">Transformer-based classifier</p>
          </div>

          <div className="rounded-lg bg-secondary/30 px-3 py-2.5">
            <p className="text-xs text-muted-foreground">Compliance Scoring Model</p>
            <p className="text-sm text-foreground">Risk heuristic + ML</p>
          </div>

        </CardContent>
      </Card>


      {/* Storage */}
      <Card className="glass-card border border-border bg-card">
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="flex items-center gap-2 text-base">
            <Cloud className="h-4 w-4 text-primary" />
            Document Storage
          </CardTitle>
        </CardHeader>

        <CardContent className="px-4 md:px-6 flex flex-col gap-2">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-secondary/30 px-3 py-2.5 rounded-lg">
            <span className="text-sm">Storage Provider</span>
            <Badge variant="outline">Google Cloud Storage</Badge>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-secondary/30 px-3 py-2.5 rounded-lg">
            <span className="text-sm">Bucket</span>
            <span className="text-xs font-mono text-muted-foreground">ai-compliance-documents</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-secondary/30 px-3 py-2.5 rounded-lg">
            <span className="text-sm">Signed URL Expiry</span>
            <span className="text-xs text-muted-foreground">10 minutes</span>
          </div>

        </CardContent>
      </Card>


      {/* Security */}
      <Card className="glass-card border border-border bg-card">
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-primary" />
            Security Configuration
          </CardTitle>
        </CardHeader>

        <CardContent className="px-4 md:px-6 flex flex-col gap-2">

          {[
            "Role Based Access Control",
            "JWT Authentication",
            "Secure Cookie Sessions",
            "Admin-only User Management",
            "Audit Logging"
          ].map((item) => (
            <div key={item} className="flex items-center justify-between bg-secondary/30 px-3 py-2.5 rounded-lg">
              <span className="text-sm">{item}</span>
              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Active</Badge>
            </div>
          ))}

        </CardContent>
      </Card>


      {/* Monitoring */}
      <Card className="glass-card border border-border bg-card">
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" />
            Monitoring and Observability
          </CardTitle>
        </CardHeader>

        <CardContent className="px-4 md:px-6 flex flex-col gap-2">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-secondary/30 px-3 py-2.5 rounded-lg">
            <span className="text-sm">Audit Logs</span>
            <Badge variant="outline">Enabled</Badge>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-secondary/30 px-3 py-2.5 rounded-lg">
            <span className="text-sm">System Health Endpoint</span>
            <Badge variant="outline">/health</Badge>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-secondary/30 px-3 py-2.5 rounded-lg">
            <span className="text-sm">Decision Metrics</span>
            <Badge variant="outline">/dashboard-metrics</Badge>
          </div>

        </CardContent>
      </Card>


      <p className="text-xs text-muted-foreground/60 text-center px-4">
        Auth logic: <code className="font-mono">lib/auth.ts</code> | 
        Upload API: <code className="font-mono">upload-service</code> | 
        Compliance Store: <code className="font-mono">compliance-store-service</code>
      </p>

    </div>
  );
}
