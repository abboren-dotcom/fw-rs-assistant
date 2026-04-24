"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, ConfidenceBadge } from "@/components/ui/badge";
import { Eye, ArrowRight, Columns2, Monitor, CheckCircle2, AlertTriangle } from "lucide-react";
import type { ResourceSpaceFieldProposal } from "@/types";

function FWFieldPreview({ label, type, required, options, value }: {
  label: string; type: string; required: boolean; options?: string[]; value?: string;
}) {
  return (
    <div className="border-b border-[rgb(var(--border))] px-4 py-3 last:border-0">
      <label className="block text-xs font-medium text-[rgb(var(--foreground))] mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {type === "textarea" || type === "longtext" ? (
        <div className="w-full h-16 rounded border border-[rgb(var(--border))] bg-[rgb(var(--secondary))] px-2 py-1.5 text-[11px] text-[rgb(var(--muted))] flex items-start">
          {value || `Enter ${label.toLowerCase()}…`}
        </div>
      ) : type === "dropdown" || type === "select" ? (
        <div className="w-full h-7 rounded border border-[rgb(var(--border))] bg-white dark:bg-[rgb(20,25,36)] px-2 flex items-center justify-between text-[11px] text-[rgb(var(--muted))]">
          <span>{value || options?.[0] || `Select ${label.toLowerCase()}…`}</span>
          <span>▾</span>
        </div>
      ) : type === "date" ? (
        <div className="w-36 h-7 rounded border border-[rgb(var(--border))] bg-white dark:bg-[rgb(20,25,36)] px-2 flex items-center text-[11px] text-[rgb(var(--muted))]">
          {value || "yyyy-mm-dd"}
        </div>
      ) : type === "keyword" || type === "keyword_list" ? (
        <div className="w-full min-h-7 rounded border border-[rgb(var(--border))] bg-white dark:bg-[rgb(20,25,36)] px-2 py-1 flex flex-wrap gap-1 text-[11px]">
          {(value ? value.split(";") : ["keyword1", "keyword2"]).map((k, i) => (
            <span key={i} className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center gap-1">
              {k.trim()}<span className="cursor-pointer">×</span>
            </span>
          ))}
        </div>
      ) : (
        <div className="w-full h-7 rounded border border-[rgb(var(--border))] bg-white dark:bg-[rgb(20,25,36)] px-2 flex items-center text-[11px] text-[rgb(var(--muted))]">
          {value || `Enter ${label.toLowerCase()}…`}
        </div>
      )}
    </div>
  );
}

function RSFieldPreview({ proposal }: { proposal: ResourceSpaceFieldProposal }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-[rgb(var(--border))] last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium">{proposal.suggestedResourceSpaceTitle}</span>
          {proposal.requiredCandidate && <span className="text-[10px] text-red-600">required</span>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{proposal.suggestedFieldType}</Badge>
          {proposal.suggestedIptcTag && (
            <Badge variant="outline" className="text-[10px]">{proposal.suggestedIptcTag}</Badge>
          )}
          {proposal.suggestedXmpTag && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
              {proposal.suggestedXmpTag}
            </span>
          )}
          <ConfidenceBadge level={proposal.confidence} />
        </div>
        {proposal.suggestedOptions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {proposal.suggestedOptions.slice(0, 5).map((o) => (
              <span key={o} className="text-[10px] px-1.5 py-0.5 rounded bg-[rgb(var(--secondary))] border border-[rgb(var(--border))]">{o}</span>
            ))}
            {proposal.suggestedOptions.length > 5 && (
              <span className="text-[10px] text-[rgb(var(--muted))]">+{proposal.suggestedOptions.length - 5} more</span>
            )}
          </div>
        )}
      </div>
      {proposal.warnings.length > 0 && (
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
      )}
    </div>
  );
}

export default function PreviewPage() {
  const router = useRouter();
  const project = useAppStore((s) => s.project);
  const [mode, setMode] = useState<"side-by-side" | "fw" | "rs">("side-by-side");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("all");

  if (!project) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 gap-4 text-center">
        <Eye className="w-12 h-12 text-[rgb(var(--muted))]" />
        <p className="text-sm text-[rgb(var(--muted))]">No project loaded.</p>
        <Button onClick={() => router.push("/analysis")} size="sm"><ArrowRight className="w-3.5 h-3.5" />Go to upload</Button>
      </div>
    );
  }

  const fieldMap = new Map(project.fields.map((f) => [f.id, f]));
  const proposalByFieldId = new Map(project.proposals.map((p) => [p.sourceFieldId, p]));

  // Filter proposals by template
  let displayProposals = project.proposals.filter((p) => p.status !== "rejected");
  if (selectedTemplate !== "all") {
    const tpl = project.templates.find((t) => t.id === selectedTemplate);
    if (tpl) {
      displayProposals = displayProposals.filter((p) => tpl.fieldIds.includes(p.sourceFieldId));
    }
  }

  // Group by template sections for FW preview
  const editorTemplates = project.templates.filter((t) => t.kind === "metadata" || t.kind === "editor");

  const acceptedCount = project.proposals.filter((p) => p.status === "accepted").length;
  const warningCount = displayProposals.filter((p) => p.warnings.length > 0).length;

  return (
    <div className="flex flex-col h-full" style={{ height: "calc(100vh - 48px)" }}>
      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-[rgb(var(--border))] px-4 py-2 flex items-center gap-3 bg-white dark:bg-[rgb(14,17,24)]">
        <div className="flex items-center border border-[rgb(var(--border))] rounded overflow-hidden">
          {([
            { value: "side-by-side", icon: Columns2, label: "Side-by-side" },
            { value: "fw", icon: Monitor, label: "FotoWare view" },
            { value: "rs", icon: Monitor, label: "ResourceSpace view" },
          ] as const).map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${mode === value ? "bg-[rgb(var(--secondary))] text-[rgb(var(--foreground))] font-medium" : "text-[rgb(var(--muted))] hover:bg-[rgb(var(--secondary))]"}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          className="h-7 px-2 text-xs rounded border border-[rgb(var(--border))] bg-white dark:bg-[rgb(20,25,36)]"
          aria-label="Filter by template"
        >
          <option value="all">All fields</option>
          {project.templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-3 text-xs text-[rgb(var(--muted))]">
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-3 h-3" />{acceptedCount} accepted
          </span>
          {warningCount > 0 && (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3 h-3" />{warningCount} warnings
            </span>
          )}
          <Button onClick={() => router.push("/export")} size="sm">
            Export → <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Preview panels */}
      <div className={`flex-1 overflow-hidden flex gap-0 ${mode === "side-by-side" ? "divide-x divide-[rgb(var(--border))]" : ""}`}>

        {/* FotoWare editor panel */}
        {(mode === "side-by-side" || mode === "fw") && (
          <div className={`flex flex-col overflow-hidden ${mode === "side-by-side" ? "flex-1" : "w-full"}`}>
            <div className="px-4 py-2 bg-[rgb(35,45,60)] text-white text-xs font-medium flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
              FotoStation Metadata Editor (source view)
            </div>
            <div className="flex-1 overflow-y-auto bg-[rgb(42,52,70)]">
              {editorTemplates.length > 0 ? editorTemplates
                .filter((t) => selectedTemplate === "all" || t.id === selectedTemplate)
                .map((tpl) => (
                  <div key={tpl.id} className="mb-0">
                    <div className="px-4 py-2 bg-[rgb(35,45,58)] text-[rgb(180,200,230)] text-[11px] font-semibold uppercase tracking-wider border-b border-[rgb(50,65,85)]">
                      {tpl.name}
                    </div>
                    {tpl.sections.map((sec) => (
                      <div key={sec.id}>
                        <div className="px-4 py-1.5 bg-[rgb(38,50,68)] text-[rgb(140,165,200)] text-[11px] font-medium border-b border-[rgb(50,65,85)]">
                          {sec.label}
                        </div>
                        <div className="bg-[rgb(48,60,80)]">
                          {sec.fieldIds.map((fid) => {
                            const f = fieldMap.get(fid);
                            if (!f) return null;
                            return (
                              <div key={fid} className="border-b border-[rgb(55,70,90)] px-4 py-2.5 last:border-0">
                                <label className="block text-[11px] font-medium text-[rgb(200,215,235)] mb-1">
                                  {f.label}{f.required && <span className="text-orange-400 ml-0.5">*</span>}
                                </label>
                                <div className={`w-full rounded border border-[rgb(65,80,105)] bg-[rgb(55,70,92)] px-2 flex items-center text-[11px] text-[rgb(160,180,210)] ${f.fwFieldType === "longtext" ? "h-12 items-start py-1.5" : "h-6"}`}>
                                  {f.exampleValues[0] ?? `${f.label}…`}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )) : (
                <div className="p-8 text-center text-[rgb(100,130,170)] text-sm">No editor templates found</div>
              )}
            </div>
          </div>
        )}

        {/* ResourceSpace target panel */}
        {(mode === "side-by-side" || mode === "rs") && (
          <div className={`flex flex-col overflow-hidden ${mode === "side-by-side" ? "flex-1" : "w-full"}`}>
            <div className="px-4 py-2 bg-[rgb(26,58,110)] text-white text-xs font-medium flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              ResourceSpace — Proposed Field Configuration
            </div>
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[rgb(14,17,24)]">
              <div className="border-b border-[rgb(var(--border))]">
                {displayProposals.map((p) => (
                  <RSFieldPreview key={p.id} proposal={p} />
                ))}
                {displayProposals.length === 0 && (
                  <div className="p-8 text-center text-sm text-[rgb(var(--muted))]">No proposals to display</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary bar */}
      <div className="flex-shrink-0 border-t border-[rgb(var(--border))] px-4 py-2 bg-[rgb(var(--secondary))] text-xs flex items-center gap-4 text-[rgb(var(--muted))]">
        <span>{displayProposals.length} fields shown</span>
        <span>{displayProposals.filter((p) => p.suggestedIptcTag || p.suggestedXmpTag).length} with metadata tag candidates</span>
        <span>{displayProposals.filter((p) => p.suggestedOptions.length > 0).length} with option lists</span>
        {warningCount > 0 && (
          <span className="text-amber-600 dark:text-amber-400">{warningCount} fields with warnings — review in Mapping Studio</span>
        )}
      </div>
    </div>
  );
}
