"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfidenceBadge, EvidenceBadge, StatusBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import {
  ArrowLeftRight,
  Search,
  Filter,
  CheckSquare,
  XSquare,
  RotateCcw,
  Info,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";
import type { ResourceSpaceFieldProposal, RSFieldType } from "@/types";

const RS_FIELD_TYPES: RSFieldType[] = [
  "text", "textarea", "date", "integer", "float",
  "dropdown", "check_box_list", "radio_buttons",
  "keyword_list", "dynamic_keyword_list",
];

const RS_TYPE_LABELS: Record<RSFieldType, string> = {
  text: "Text",
  textarea: "Long text (textarea)",
  date: "Date",
  integer: "Integer",
  float: "Decimal (float)",
  dropdown: "Dropdown",
  check_box_list: "Checkbox list",
  radio_buttons: "Radio buttons",
  keyword_list: "Keyword list",
  dynamic_keyword_list: "Dynamic keyword list",
  access: "Access",
  image: "Image",
  resource_type: "Resource type",
  search_bar: "Search bar",
  upload_plupload: "Upload",
  date_range: "Date range",
};

function ProposalRow({ proposal, field, artifact, onUpdate, onAccept, onReject, onReset }: {
  proposal: ResourceSpaceFieldProposal;
  field: { code: string; label: string; exampleValues: string[] } | undefined;
  artifact: { filename: string } | undefined;
  onUpdate: (patch: Partial<ResourceSpaceFieldProposal>) => void;
  onAccept: () => void;
  onReject: () => void;
  onReset: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const rejected = proposal.status === "rejected";

  return (
    <>
      <tr className={`border-b border-[rgb(var(--border))] transition-colors text-xs ${rejected ? "opacity-40" : "hover:bg-[rgb(var(--secondary))]"}`}>
        {/* Source info */}
        <td className="px-3 py-2.5">
          <div className="font-mono text-[10px] text-[rgb(var(--muted))]">{field?.code ?? "—"}</div>
          <div className="font-medium truncate max-w-[120px]" title={proposal.sourceLabel}>{proposal.sourceLabel}</div>
          <div className="text-[10px] text-[rgb(var(--muted))] truncate max-w-[120px]">{artifact?.filename}</div>
        </td>

        {/* Source type */}
        <td className="px-3 py-2.5">
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-[rgb(var(--secondary))] border border-[rgb(var(--border))]">
            {proposal.sourceTypeGuess}
          </span>
        </td>

        {/* Suggested RS name */}
        <td className="px-3 py-2.5">
          <Input
            value={proposal.suggestedResourceSpaceName}
            onChange={(e) => onUpdate({ suggestedResourceSpaceName: e.target.value })}
            className="h-6 text-[11px] font-mono w-36"
            disabled={rejected}
            aria-label="ResourceSpace field name"
          />
        </td>

        {/* Suggested RS title */}
        <td className="px-3 py-2.5">
          <Input
            value={proposal.suggestedResourceSpaceTitle}
            onChange={(e) => onUpdate({ suggestedResourceSpaceTitle: e.target.value })}
            className="h-6 text-[11px] w-36"
            disabled={rejected}
            aria-label="ResourceSpace display title"
          />
        </td>

        {/* Field type */}
        <td className="px-3 py-2.5">
          <Select
            value={proposal.suggestedFieldType}
            onChange={(e) => onUpdate({ suggestedFieldType: e.target.value as RSFieldType })}
            className="h-6 text-[11px] w-40"
            disabled={rejected}
            aria-label="ResourceSpace field type"
          >
            {RS_FIELD_TYPES.map((t) => (
              <option key={t} value={t}>{RS_TYPE_LABELS[t]}</option>
            ))}
          </Select>
        </td>

        {/* IPTC/XMP */}
        <td className="px-3 py-2.5">
          <div className="text-[11px] text-[rgb(var(--muted))]">
            {proposal.suggestedIptcTag && <div title="IPTC">{proposal.suggestedIptcTag}</div>}
            {proposal.suggestedXmpTag && <div title="XMP" className="text-purple-600 dark:text-purple-400">{proposal.suggestedXmpTag}</div>}
            {!proposal.suggestedIptcTag && !proposal.suggestedXmpTag && <span className="italic">None</span>}
          </div>
        </td>

        {/* Flags */}
        <td className="px-3 py-2.5">
          <div className="flex gap-1 flex-wrap">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={proposal.requiredCandidate}
                onChange={(e) => onUpdate({ requiredCandidate: e.target.checked })}
                disabled={rejected}
                className="w-3 h-3"
              />
              <span className="text-[10px]">req</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={proposal.readOnlyCandidate}
                onChange={(e) => onUpdate({ readOnlyCandidate: e.target.checked })}
                disabled={rejected}
                className="w-3 h-3"
              />
              <span className="text-[10px]">ro</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={proposal.includeInCsvExport}
                onChange={(e) => onUpdate({ includeInCsvExport: e.target.checked })}
                disabled={rejected}
                className="w-3 h-3"
              />
              <span className="text-[10px]">csv</span>
            </label>
          </div>
        </td>

        {/* Confidence */}
        <td className="px-3 py-2.5">
          <ConfidenceBadge level={proposal.confidence} />
        </td>

        {/* Status */}
        <td className="px-3 py-2.5">
          <StatusBadge status={proposal.status} />
        </td>

        {/* Actions */}
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1">
            {proposal.warnings.length > 0 && (
              <Tooltip content={proposal.warnings.join("\n")} side="left">
                <span><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /></span>
              </Tooltip>
            )}
            <Tooltip content="Expand / notes" side="left">
              <button onClick={() => setExpanded(!expanded)} className="p-1 rounded hover:bg-[rgb(var(--secondary))] text-[rgb(var(--muted))]" aria-label="Expand row">
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </Tooltip>
            {proposal.status !== "accepted" && proposal.status !== "rejected" && (
              <Tooltip content="Accept" side="left">
                <button onClick={onAccept} className="p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600" aria-label="Accept">
                  <CheckSquare className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            )}
            {proposal.status !== "rejected" ? (
              <Tooltip content="Reject" side="left">
                <button onClick={onReject} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500" aria-label="Reject">
                  <XSquare className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            ) : (
              <Tooltip content="Restore" side="left">
                <button onClick={onReset} className="p-1 rounded hover:bg-[rgb(var(--secondary))] text-[rgb(var(--muted))]" aria-label="Restore">
                  <RotateCcw className="w-3 h-3" />
                </button>
              </Tooltip>
            )}
          </div>
        </td>
      </tr>
      {/* Expanded row: options + notes */}
      {expanded && (
        <tr className="border-b border-[rgb(var(--border))] bg-[rgb(var(--secondary))]">
          <td colSpan={10} className="px-4 py-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-medium text-[rgb(var(--muted))] mb-1 block">
                  Options (semicolon-separated)
                </label>
                <Input
                  value={proposal.suggestedOptions.join("; ")}
                  onChange={(e) => onUpdate({ suggestedOptions: e.target.value.split(";").map((s) => s.trim()).filter(Boolean) })}
                  placeholder="Value 1; Value 2; Value 3"
                  className="h-7 text-xs"
                  disabled={rejected}
                />
                {field?.exampleValues?.length ? (
                  <p className="text-[10px] text-[rgb(var(--muted))] mt-1">Examples: {field.exampleValues.join(", ")}</p>
                ) : null}
              </div>
              <div>
                <label className="text-[11px] font-medium text-[rgb(var(--muted))] mb-1 block">Notes</label>
                <Input
                  value={proposal.notes}
                  onChange={(e) => onUpdate({ notes: e.target.value })}
                  placeholder="Add a note…"
                  className="h-7 text-xs"
                  disabled={rejected}
                />
                {proposal.rationale && (
                  <p className="text-[10px] text-[rgb(var(--muted))] mt-1">
                    <Info className="inline w-2.5 h-2.5 mr-1" />
                    {proposal.rationale}
                  </p>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function MappingPage() {
  const router = useRouter();
  const { project, mappingFilters, setMappingFilter, resetMappingFilters, updateProposal, acceptProposal, rejectProposal, resetProposalStatus } = useAppStore();

  const [sortField, setSortField] = useState<"label" | "confidence" | "status">("label");
  const [sortAsc, setSortAsc] = useState(true);

  if (!project) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 gap-4 text-center">
        <ArrowLeftRight className="w-12 h-12 text-[rgb(var(--muted))]" />
        <p className="text-sm text-[rgb(var(--muted))]">No project loaded. Upload files or load the demo project first.</p>
        <Button onClick={() => router.push("/analysis")} size="sm"><ArrowRight className="w-3.5 h-3.5" />Go to upload</Button>
      </div>
    );
  }

  const fieldMap = new Map(project.fields.map((f) => [f.id, f]));
  const artifactMap = new Map(project.artifacts.map((a) => [a.id, a]));

  const filtered = useMemo(() => {
    let list = [...project.proposals];
    if (mappingFilters.searchQuery) {
      const q = mappingFilters.searchQuery.toLowerCase();
      list = list.filter((p) => p.sourceLabel.toLowerCase().includes(q) || p.suggestedResourceSpaceName.toLowerCase().includes(q));
    }
    if (mappingFilters.showLowConfidenceOnly) list = list.filter((p) => p.confidence === "low");
    if (mappingFilters.showRequiredOnly) list = list.filter((p) => p.requiredCandidate);
    if (mappingFilters.showUnmappedOnly) list = list.filter((p) => p.status === "needs_review" || p.status === "proposed");
    if (mappingFilters.showListsOnly) list = list.filter((p) => ["dropdown", "check_box_list", "keyword_list", "dynamic_keyword_list"].includes(p.suggestedFieldType));

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "label") cmp = a.sourceLabel.localeCompare(b.sourceLabel);
      else if (sortField === "confidence") cmp = ["high", "medium", "low"].indexOf(a.confidence) - ["high", "medium", "low"].indexOf(b.confidence);
      else if (sortField === "status") cmp = a.status.localeCompare(b.status);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [project.proposals, mappingFilters, sortField, sortAsc]);

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortAsc((v) => !v);
    else { setSortField(field); setSortAsc(true); }
  }

  const SortIcon = ({ f }: { f: typeof sortField }) => sortField === f
    ? (sortAsc ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)
    : null;

  const accepted = project.proposals.filter((p) => p.status === "accepted").length;
  const rejected = project.proposals.filter((p) => p.status === "rejected").length;
  const needsReview = project.proposals.filter((p) => p.status === "needs_review").length;

  return (
    <div className="flex flex-col h-full" style={{ height: "calc(100vh - 48px)" }}>
      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-[rgb(var(--border))] px-4 py-2.5 flex items-center gap-3 flex-wrap bg-white dark:bg-[rgb(14,17,24)]">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[rgb(var(--muted))]" />
          <Input
            value={mappingFilters.searchQuery}
            onChange={(e) => setMappingFilter({ searchQuery: e.target.value })}
            placeholder="Search fields…"
            className="pl-6 h-7 text-xs w-48"
            aria-label="Search fields"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {([
            { key: "showLowConfidenceOnly", label: "Low confidence" },
            { key: "showRequiredOnly", label: "Required only" },
            { key: "showUnmappedOnly", label: "Needs review" },
            { key: "showListsOnly", label: "Lists only" },
          ] as const).map(({ key, label }) => (
            <label key={key} className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={mappingFilters[key]}
                onChange={(e) => setMappingFilter({ [key]: e.target.checked })}
                className="w-3 h-3"
              />
              <span>{label}</span>
            </label>
          ))}
          <Button variant="ghost" size="sm" onClick={resetMappingFilters} className="h-6 text-[11px]">
            <RotateCcw className="w-2.5 h-2.5" />Reset
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-3 text-xs text-[rgb(var(--muted))]">
          <span>{filtered.length} shown / {project.proposals.length} total</span>
          <span className="text-green-600 dark:text-green-400">{accepted} accepted</span>
          <span className="text-red-500">{rejected} rejected</span>
          <span className="text-amber-600 dark:text-amber-400">{needsReview} need review</span>
          <Button onClick={() => router.push("/preview")} size="sm">
            Preview → <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs tabnum border-collapse min-w-[900px]">
          <thead className="sticky top-0 z-10 bg-[rgb(var(--secondary))] border-b border-[rgb(var(--border))]">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-[rgb(var(--muted))] w-36">
                <button className="flex items-center gap-1" onClick={() => toggleSort("label")}>
                  Source <SortIcon f="label" />
                </button>
              </th>
              <th className="text-left px-3 py-2 font-medium text-[rgb(var(--muted))] w-24">FW Type</th>
              <th className="text-left px-3 py-2 font-medium text-[rgb(var(--muted))] w-36">RS Name</th>
              <th className="text-left px-3 py-2 font-medium text-[rgb(var(--muted))] w-36">RS Title</th>
              <th className="text-left px-3 py-2 font-medium text-[rgb(var(--muted))] w-44">RS Type</th>
              <th className="text-left px-3 py-2 font-medium text-[rgb(var(--muted))] w-40">IPTC / XMP</th>
              <th className="text-left px-3 py-2 font-medium text-[rgb(var(--muted))] w-24">Flags</th>
              <th className="text-left px-3 py-2 font-medium text-[rgb(var(--muted))] w-24">
                <button className="flex items-center gap-1" onClick={() => toggleSort("confidence")}>
                  Confidence <SortIcon f="confidence" />
                </button>
              </th>
              <th className="text-left px-3 py-2 font-medium text-[rgb(var(--muted))] w-28">
                <button className="flex items-center gap-1" onClick={() => toggleSort("status")}>
                  Status <SortIcon f="status" />
                </button>
              </th>
              <th className="text-left px-3 py-2 font-medium text-[rgb(var(--muted))] w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const field = fieldMap.get(p.sourceFieldId);
              const artifact = field ? artifactMap.get(field.sourceArtifactId) : undefined;
              return (
                <ProposalRow
                  key={p.id}
                  proposal={p}
                  field={field}
                  artifact={artifact}
                  onUpdate={(patch) => updateProposal(p.id, patch)}
                  onAccept={() => acceptProposal(p.id)}
                  onReject={() => rejectProposal(p.id)}
                  onReset={() => resetProposalStatus(p.id)}
                />
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-sm text-[rgb(var(--muted))]">
            <Filter className="w-8 h-8 mx-auto mb-3" />
            No proposals match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}
