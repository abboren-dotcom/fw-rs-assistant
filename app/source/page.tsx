"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, StatusBadge, ConfidenceBadge, EvidenceBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatBytes, truncate } from "@/lib/utils";
import {
  FolderTree,
  FileText,
  List,
  LayoutTemplate,
  Settings2,
  ChevronRight,
  ChevronDown,
  Search,
  ArrowRight,
} from "lucide-react";
import type { SourceArtifact } from "@/types";

const TYPE_ICONS: Record<string, React.ElementType> = {
  metadata_template: LayoutTemplate,
  display_template: LayoutTemplate,
  text_template: FileText,
  quick_list: List,
  editor_config: Settings2,
  xml_config: FileText,
  ini_config: Settings2,
  json_config: FileText,
  csv_data: List,
  unknown: FileText,
};

const TYPE_LABELS: Record<string, string> = {
  metadata_template: "Metadata Template",
  display_template: "Display Template",
  text_template: "Text Template",
  quick_list: "Quick List",
  editor_config: "Editor Config",
  xml_config: "XML Config",
  ini_config: "INI Config",
  json_config: "JSON Config",
  csv_data: "CSV Data",
  unknown: "Unknown",
};

function ArtifactRow({ artifact, onClick, active }: { artifact: SourceArtifact; onClick: () => void; active: boolean }) {
  const Icon = TYPE_ICONS[artifact.detectedType] ?? FileText;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-left transition-colors text-sm ${active ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40" : "hover:bg-[rgb(var(--secondary))] border border-transparent"}`}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-blue-600 dark:text-blue-400" : "text-[rgb(var(--muted))]"}`} />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-xs truncate">{artifact.filename}</div>
        <div className="text-[11px] text-[rgb(var(--muted))]">{TYPE_LABELS[artifact.detectedType]} · {formatBytes(artifact.sizeBytes)}</div>
      </div>
      <StatusBadge status={artifact.parseStatus} />
      {active && <ChevronRight className="w-3 h-3 flex-shrink-0 text-blue-600" />}
    </button>
  );
}

export default function SourcePage() {
  const router = useRouter();
  const project = useAppStore((s) => s.project);
  const [selectedId, setSelectedId] = useState<string | null>(project?.artifacts[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ fields: true, templates: true, ql: true });

  if (!project) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 gap-4 text-center">
        <FolderTree className="w-12 h-12 text-[rgb(var(--muted))]" />
        <p className="text-sm text-[rgb(var(--muted))]">No project loaded. Upload files or load the demo project first.</p>
        <Button onClick={() => router.push("/analysis")} size="sm"><ArrowRight className="w-3.5 h-3.5" />Go to upload</Button>
      </div>
    );
  }

  const filteredArtifacts = project.artifacts.filter((a) =>
    !query || a.filename.toLowerCase().includes(query.toLowerCase()) || TYPE_LABELS[a.detectedType].toLowerCase().includes(query.toLowerCase())
  );

  const selected = selectedId ? project.artifacts.find((a) => a.id === selectedId) : null;
  const artifactFields = selected ? project.fields.filter((f) => f.sourceArtifactId === selected.id) : [];
  const artifactTemplates = selected ? project.templates.filter((t) => t.sourceArtifactId === selected.id) : [];
  const artifactQLs = selected ? project.quickLists.filter((q) => q.sourceArtifactId === selected.id) : [];

  function toggle(k: string) {
    setExpandedSections((prev) => ({ ...prev, [k]: !prev[k] }));
  }

  return (
    <div className="flex h-full" style={{ height: "calc(100vh - 48px)" }}>
      {/* Left: Artifact list */}
      <div className="w-64 border-r border-[rgb(var(--border))] flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-[rgb(var(--border))]">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[rgb(var(--muted))]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter files…"
              className="pl-7 h-7 text-xs"
              aria-label="Filter files"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filteredArtifacts.map((artifact) => (
            <ArtifactRow
              key={artifact.id}
              artifact={artifact}
              onClick={() => setSelectedId(artifact.id)}
              active={selectedId === artifact.id}
            />
          ))}
          {filteredArtifacts.length === 0 && (
            <p className="text-xs text-[rgb(var(--muted))] text-center py-6">No artifacts match</p>
          )}
        </div>
      </div>

      {/* Right: Detail */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {selected ? (
          <>
            {/* File header */}
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-[rgb(var(--secondary))] rounded-lg">
                {(() => { const Icon = TYPE_ICONS[selected.detectedType] ?? FileText; return <Icon className="w-5 h-5 text-[rgb(var(--muted))]" />; })()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sm truncate">{selected.filename}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs text-[rgb(var(--muted))]">{selected.relativePath}</span>
                  <Badge variant="secondary">{TYPE_LABELS[selected.detectedType]}</Badge>
                  <StatusBadge status={selected.parseStatus} />
                  <span className="text-xs text-[rgb(var(--muted))]">{formatBytes(selected.sizeBytes)}</span>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {selected.parseWarnings.length > 0 && (
              <div className="p-3 rounded border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-700 dark:text-amber-400 space-y-1">
                {selected.parseWarnings.map((w, i) => <p key={i}>⚠ {w}</p>)}
              </div>
            )}

            {/* Raw preview */}
            <Card>
              <CardHeader><CardTitle>Raw Preview (first 500 chars)</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-[11px] font-mono text-[rgb(var(--muted))] whitespace-pre-wrap leading-relaxed bg-[rgb(var(--secondary))] rounded p-3 overflow-x-auto">
                  {selected.rawPreview || "(no preview available)"}
                </pre>
              </CardContent>
            </Card>

            {/* Templates */}
            {artifactTemplates.length > 0 && (
              <Card>
                <button className="w-full" onClick={() => toggle("templates")}>
                  <CardHeader className="hover:bg-[rgb(var(--secondary))] transition-colors rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      {expandedSections.templates ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      Templates ({artifactTemplates.length})
                    </CardTitle>
                  </CardHeader>
                </button>
                {expandedSections.templates && (
                  <CardContent>
                    {artifactTemplates.map((t) => (
                      <div key={t.id} className="mb-4 last:mb-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-xs">{t.name}</span>
                          <Badge variant="secondary">{t.kind}</Badge>
                          <ConfidenceBadge level={t.confidence} />
                        </div>
                        {t.sections.map((sec) => (
                          <div key={sec.id} className="mb-2 pl-3 border-l-2 border-[rgb(var(--border))]">
                            <div className="text-xs font-medium text-[rgb(var(--muted))] mb-1">{sec.label}</div>
                            <div className="flex flex-wrap gap-1">
                              {sec.fieldIds.map((fid) => {
                                const f = project.fields.find((ff) => ff.id === fid);
                                return f ? (
                                  <span key={fid} className="text-[11px] px-1.5 py-0.5 rounded bg-[rgb(var(--secondary))] border border-[rgb(var(--border))]">
                                    {f.label}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            )}

            {/* Fields */}
            {artifactFields.length > 0 && (
              <Card>
                <button className="w-full" onClick={() => toggle("fields")}>
                  <CardHeader className="hover:bg-[rgb(var(--secondary))] transition-colors rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      {expandedSections.fields ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      Fields ({artifactFields.length})
                    </CardTitle>
                  </CardHeader>
                </button>
                {expandedSections.fields && (
                  <CardContent className="p-0">
                    <table className="w-full text-xs tabnum">
                      <thead>
                        <tr className="border-b border-[rgb(var(--border))] bg-[rgb(var(--secondary))]">
                          <th className="text-left px-4 py-2 font-medium text-[rgb(var(--muted))]">Code</th>
                          <th className="text-left px-4 py-2 font-medium text-[rgb(var(--muted))]">Label</th>
                          <th className="text-left px-4 py-2 font-medium text-[rgb(var(--muted))]">Type</th>
                          <th className="text-left px-4 py-2 font-medium text-[rgb(var(--muted))]">Flags</th>
                          <th className="text-left px-4 py-2 font-medium text-[rgb(var(--muted))]">Evidence</th>
                          <th className="text-left px-4 py-2 font-medium text-[rgb(var(--muted))]">Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {artifactFields.map((f) => (
                          <tr key={f.id} className="border-b border-[rgb(var(--border))] hover:bg-[rgb(var(--secondary))] transition-colors">
                            <td className="px-4 py-2 font-mono text-[11px] text-[rgb(var(--muted))]">{f.code}</td>
                            <td className="px-4 py-2 font-medium">{f.label}</td>
                            <td className="px-4 py-2">
                              <Badge variant="outline">{f.fwFieldType}</Badge>
                            </td>
                            <td className="px-4 py-2 flex gap-1 flex-wrap">
                              {f.required && <span className="text-[10px] px-1 py-0.5 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40">required</span>}
                              {f.readOnly && <span className="text-[10px] px-1 py-0.5 rounded bg-[rgb(var(--secondary))] text-[rgb(var(--muted))] border border-[rgb(var(--border))]">read-only</span>}
                              {f.multiValue && <span className="text-[10px] px-1 py-0.5 rounded bg-[rgb(var(--secondary))] text-[rgb(var(--muted))] border border-[rgb(var(--border))]">multi</span>}
                            </td>
                            <td className="px-4 py-2"><EvidenceBadge kind={f.evidence} /></td>
                            <td className="px-4 py-2"><ConfidenceBadge level={f.confidence} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Quick lists */}
            {artifactQLs.length > 0 && (
              <Card>
                <button className="w-full" onClick={() => toggle("ql")}>
                  <CardHeader className="hover:bg-[rgb(var(--secondary))] transition-colors rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      {expandedSections.ql ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      Quick Lists ({artifactQLs.length})
                    </CardTitle>
                  </CardHeader>
                </button>
                {expandedSections.ql && (
                  <CardContent className="space-y-3">
                    {artifactQLs.map((ql) => (
                      <div key={ql.id}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-medium text-xs">{ql.displayName}</span>
                          <ConfidenceBadge level={ql.confidence} />
                          <span className="text-[11px] text-[rgb(var(--muted))]">{ql.values.length} values</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {ql.values.slice(0, 20).map((v) => (
                            <span key={v.code} className="text-[11px] px-1.5 py-0.5 rounded border border-[rgb(var(--border))] bg-[rgb(var(--secondary))]">
                              {v.label}
                            </span>
                          ))}
                          {ql.values.length > 20 && (
                            <span className="text-[11px] text-[rgb(var(--muted))] px-1.5 py-0.5">+{ql.values.length - 20} more</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
            <FileText className="w-10 h-10 text-[rgb(var(--muted))]" />
            <p className="text-sm text-[rgb(var(--muted))]">Select a file from the left to inspect it</p>
          </div>
        )}
      </div>
    </div>
  );
}
