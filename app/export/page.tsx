"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { buildExportBundle, downloadFile } from "@/lib/exporters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Download,
  FileJson,
  FileText,
  FileSpreadsheet,
  BookOpen,
  Package,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

interface FileInfo {
  filename: string;
  icon: React.ElementType;
  desc: string;
  mimeType: string;
}

const FILES: FileInfo[] = [
  { filename: "mapping-report.json", icon: FileJson, desc: "Complete structured export — parsed artifacts, inferred entities, mappings, confidence scores, issues", mimeType: "application/json" },
  { filename: "mapping-report.csv", icon: FileSpreadsheet, desc: "Flattened review table for spreadsheet users", mimeType: "text/csv" },
  { filename: "resourcespace-fields.csv", icon: FileSpreadsheet, desc: "One row per proposed ResourceSpace field with type, options, IPTC/XMP candidates", mimeType: "text/csv" },
  { filename: "metadata-crosswalk.csv", icon: FileSpreadsheet, desc: "Source-to-target field crosswalk for all mappings", mimeType: "text/csv" },
  { filename: "sample-import.csv", icon: FileSpreadsheet, desc: "CSV template with column headers and example rows for ResourceSpace import", mimeType: "text/csv" },
  { filename: "setup-report.md", icon: BookOpen, desc: "Human-readable Markdown report with setup guide, assumptions, and manual checklist", mimeType: "text/markdown" },
];

export default function ExportPage() {
  const router = useRouter();
  const project = useAppStore((s) => s.project);
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());
  const [buildError, setBuildError] = useState<string | null>(null);

  if (!project) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 gap-4 text-center">
        <Download className="w-12 h-12 text-[rgb(var(--muted))]" />
        <p className="text-sm text-[rgb(var(--muted))]">No project loaded.</p>
        <Button onClick={() => router.push("/analysis")} size="sm"><ArrowRight className="w-3.5 h-3.5" />Go to upload</Button>
      </div>
    );
  }

  const accepted = project.proposals.filter((p) => p.status === "accepted").length;
  const needsReview = project.proposals.filter((p) => p.status === "needs_review").length;
  const rejected = project.proposals.filter((p) => p.status === "rejected").length;
  const hasIssues = needsReview > 0;

  function handleDownload(filename: string) {
    try {
      const bundle = buildExportBundle(project!);
      const file = bundle.files.find((f) => f.filename === filename);
      if (!file) { setBuildError(`Could not generate ${filename}`); return; }
      downloadFile(file.filename, file.mimeType, file.content);
      setDownloaded((prev) => new Set([...prev, filename]));
      setBuildError(null);
    } catch (err) {
      setBuildError(String(err));
    }
  }

  function handleDownloadAll() {
    try {
      const bundle = buildExportBundle(project!);
      bundle.files.forEach((f) => {
        downloadFile(f.filename, f.mimeType, f.content);
      });
      setDownloaded(new Set(bundle.files.map((f) => f.filename)));
      setBuildError(null);
    } catch (err) {
      setBuildError(String(err));
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Status summary */}
      <Card>
        <CardHeader><CardTitle>Export Readiness</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40">
              <div className="text-xl font-bold tabnum text-green-700 dark:text-green-400">{accepted}</div>
              <div className="text-xs text-green-700 dark:text-green-400">Accepted</div>
            </div>
            <div className={`text-center p-3 rounded border ${needsReview > 0 ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40" : "bg-[rgb(var(--secondary))] border-[rgb(var(--border))]"}`}>
              <div className={`text-xl font-bold tabnum ${needsReview > 0 ? "text-amber-700 dark:text-amber-400" : "text-[rgb(var(--muted))]"}`}>{needsReview}</div>
              <div className={`text-xs ${needsReview > 0 ? "text-amber-700 dark:text-amber-400" : "text-[rgb(var(--muted))]"}`}>Needs review</div>
            </div>
            <div className="text-center p-3 rounded bg-[rgb(var(--secondary))] border border-[rgb(var(--border))]">
              <div className="text-xl font-bold tabnum text-[rgb(var(--muted))]">{rejected}</div>
              <div className="text-xs text-[rgb(var(--muted))]">Rejected</div>
            </div>
          </div>

          {hasIssues && (
            <div className="flex items-start gap-2 p-3 rounded border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <div>
                <strong>{needsReview} field{needsReview > 1 ? "s" : ""} still need review</strong> in the Mapping Studio.
                You can still export now — low-confidence fields will be flagged in the output files.
                <Button variant="ghost" size="sm" className="ml-2 h-5 text-[11px] text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30" onClick={() => router.push("/mapping")}>
                  Go to Mapping Studio →
                </Button>
              </div>
            </div>
          )}

          {buildError && (
            <div className="p-3 rounded border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 text-xs text-red-700 dark:text-red-400">
              Export error: {buildError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* File downloads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Export Files</span>
            <Button onClick={handleDownloadAll} size="sm">
              <Package className="w-3.5 h-3.5" />
              Download all
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {FILES.map(({ filename, icon: Icon, desc, mimeType }) => (
            <div key={filename} className="flex items-start gap-3 p-3 rounded border border-[rgb(var(--border))] hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5 text-[rgb(var(--muted))]" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-medium">{filename}</span>
                  {downloaded.has(filename) && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <p className="text-[11px] text-[rgb(var(--muted))] mt-0.5">{desc}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleDownload(filename)} className="flex-shrink-0">
                <Download className="w-3 h-3" />
                Download
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Unresolved issues */}
      {project.issues.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Unresolved Issues (included in setup-report.md)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {project.issues.map((issue) => (
              <div key={issue.id} className={`flex gap-2 p-2.5 rounded border text-xs ${issue.severity === "error" ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/40" : issue.severity === "warning" ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/40" : "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/40"}`}>
                <AlertTriangle className={`w-3 h-3 mt-0.5 flex-shrink-0 ${issue.severity === "error" ? "text-red-600" : issue.severity === "warning" ? "text-amber-600" : "text-blue-600"}`} />
                <div>
                  <div className="font-medium">{issue.message}</div>
                  <div className="text-[rgb(var(--muted))] mt-0.5">→ {issue.suggestedAction}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Manual checklist */}
      <Card>
        <CardHeader><CardTitle>Manual Follow-Up Checklist</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-1.5 text-sm">
            {[
              "Review all low-confidence field mappings in the Mapping Studio",
              "Verify controlled vocabulary lists are complete before import",
              "Configure ResourceSpace field display groups to mirror FotoStation editor sections",
              "Set up ExifTool mapping for embedded metadata read/write",
              "Test a sample CSV import with the provided sample-import.csv template",
              "Configure ResourceSpace user permissions and access control",
              "Set up search indices for keyword fields",
              "Review field ordering in ResourceSpace to match editorial workflow",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[rgb(var(--muted))]">
                <span className="mt-0.5 w-3.5 h-3.5 rounded border border-[rgb(var(--border))] flex-shrink-0" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-[rgb(var(--muted))]">
            This checklist is also included in <code>setup-report.md</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
