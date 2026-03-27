"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sparkles, ChevronDown, ChevronUp, Info } from "lucide-react";

interface AIExplanationCardProps {
  explanation: string;
  triggerSentences?: string[];
}

// ============================================================
// This component renders AI-generated compliance explanations
// ============================================================

export function AIExplanationCard({ explanation, triggerSentences = [] }: AIExplanationCardProps) {
  const [expanded, setExpanded] = useState(false);

  const shortText =
    explanation.length > 180
      ? `${explanation.slice(0, 180)}...`
      : explanation;

  return (
    <Card className="glass-card relative overflow-hidden border-primary/20">
      {/* Glow accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              AI-Generated Insight
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors" aria-label="More info about AI insights">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-popover text-popover-foreground">
                  <p className="text-xs">
                    Generated using optimized, low-token LLM reasoning
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-foreground/90">
          {expanded ? explanation : shortText}
        </p>

        {/* Highlighted clauses detected by compliance engine */}
        {triggerSentences.length > 0 && (
          <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Triggered Clauses
            </div>

            <ul className="space-y-2">
              {triggerSentences.map((sentence, index) => (
                <li
                  key={index}
                  className="rounded-md bg-background/60 px-2 py-1 text-xs leading-relaxed text-foreground/90 border border-border"
                >
                  "{sentence}"
                </li>
              ))}
            </ul>
          </div>
        )}

        {explanation.length > 180 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="mt-2 h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
          >
            {expanded ? (
              <>
                Show less <ChevronUp className="ml-1 h-3 w-3" />
              </>
            ) : (
              <>
                Read more <ChevronDown className="ml-1 h-3 w-3" />
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
