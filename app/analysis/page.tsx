"use client";

import { useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { DEMO_PROJECT } from "@/lib/demo/data";
import { parseUploadedFiles } from "@/lib/parsers";
import { runInference } from "@/lib/inference";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { nanoid, isoNow } from "@/lib/utils";
import type { UploadedFile, ParseDiagnostic, SourceConfigProject } from "@/types";
import {
  Upload,
  FileText,
  X,
  Zap,
  Play,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
} from "lucide-react";

function computeStats(project: SourceConfigProject) {
  return {
    artifactCount: project.artifacts.length,
    fieldCount: project.fields.length,
    templateCount: project.templates.length,
    quickListCount: project.quickLists.length,
    issueCount: project.issues.length,
    proposalCount: project.proposals.length,
    lowConfidenceCount: project.proposals.filter((p) => p.confidence === "low").length,
    needsManualReviewCount: project.proposals.filter((p) => p.status === "needs_review").length,
  };
}

export default function AnalysisPage() {
  const router = useRouter();
  const { setProject, setDiagnostics, setIsAnalyzing, isAnalyzing } = useAppStore();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [diagnostics, setLocalDiagnostics] = useState<ParseDiagnostic[]>([]);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFile = (file: File, relativePath?: string): Promise<UploadedFile> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({
          name: file.name,
          size: file.size,
          type: file.type,
          content: reader.result as string,
          relativePath: relativePath ?? file.name,
        });
      reader.onerror = reject;
      reader.readAsText(file);
    });

  async function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    const parsed: UploadedFile[] = [];

    for (const file of arr) {
      try {
        const uf = await readFile(file, (file as { webkitRelativePath?: string }).webkitRelativePath || file.name);
        parsed.push(uf);
      } catch {
        // Skip unreadable files silently
      }
    }
    setUploadedFiles((prev) => [...prev, ...parsed]);
  }

  function removeFile(name: string) {
    setUploadedFiles((prev) => prev.filter((f) => f.name !== name));
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }, []);

  async function runAnalysis() {
    if (uploadedFiles.length === 0) return;
    setIsAnalyzing(true);
    setDone(false);

    await new Promise((r) => setTimeout(r, 50)); // let UI update

    const parseResult = parseUploadedFiles(uploadedFiles);
    const inferenceResult = runInference(parseResult.fields, parseResult.quickLists, parseResult.templates);

    const project: SourceConfigProject = {
      id: nanoid("proj"),
      createdAt: isoNow(),
      updatedAt: isoNow(),
      name: uploadedFiles.length === 1 ? uploadedFiles[0].name : `Analysis — ${uploadedFiles.length} files`,
      isDemo: false,
      artifacts: parseResult.artifacts,
      fields: parseResult.fields,
      templates: parseResult.templates,
      quickLists: parseResult.quickLists,
      issues: inferenceResult.issues,
      proposals: inferenceResult.proposals,
      mappings: inferenceResult.mappings,
      stats: { artifactCount: 0, fieldCount: 0, templateCount: 0, quickListCount: 0, issueCount: 0, proposalCount: 0, lowConfidenceCount: 0, needsManualReviewCount: 0 },
    };
    project.stats = computeStats(project);

    setProject(project);
    setDiagnostics(parseResult.diagnostics);
    setLocalDiagnostics(parseResult.diagnostics);
    setIsAnalyzing(false);
    setDone(true);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Drop zone */}
      <Card>
        <CardHeader><CardTitle>Upload Configuration Files</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${dragActive ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20" : "border-[rgb(var(--border))] hover:border-blue-300 hover:bg-[rgb(var(--secondary))]"}`}
            onDragEnter={() => setDragActive(true)}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Upload files by clicking or dragging"
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          >
            <Upload className="w-8 h-8 mx-auto mb-3 text-[rgb(var(--muted))]" />
            <p className="text-sm font-medium mb-1">Drop files here or click to browse</p>
            <p className="text-xs text-[rgb(var(--muted))]">
              Supports .xml, .txt, .csv, .ini, .json, .fmt — up to 10 MB each
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              accept=".xml,.txt,.csv,.ini,.json,.fmt,.cfg,.conf,.mdt,.ql,.qls,.htm,.html,.md,.yaml,.yml,.properties"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </div>

          {/* File list */}
          {uploadedFiles.length > 0 && (
            <div>
              <div className="text-xs font-medium text-[rgb(var(--muted))] mb-2 uppercase tracking-wider">
                {uploadedFiles.length} file{uploadedFiles.length > 1 ? "s" : ""} queued
              </div>
              <ul className="space-y-1">
                {uploadedFiles.map((f) => (
                  <li key={f.name} className="flex items-center gap-2 px-3 py-2 rounded bg-[rgb(var(--secondary))] border border-[rgb(var(--border))] text-sm">
                    <FileText className="w-3.5 h-3.5 flex-shrink-0 text-[rgb(var(--muted))]" />
                    <span className="flex-1 truncate font-mono text-xs">{f.relativePath ?? f.name}</span>
                    <span className="text-[11px] text-[rgb(var(--muted))]">{(f.size / 1024).toFixed(1)} KB</span>
                    <button onClick={() => removeFile(f.name)} className="text-[rgb(var(--muted))] hover:text-red-600 p-0.5 rounded" aria-label={`Remove ${f.name}`}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              onClick={runAnalysis}
              disabled={uploadedFiles.length === 0 || isAnalyzing}
              size="md"
            >
              <Play className="w-3.5 h-3.5" />
              {isAnalyzing ? "Analyzing…" : "Run analysis"}
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => { setProject(DEMO_PROJECT); router.push("/"); }}
            >
              <Zap className="w-3.5 h-3.5" />
              Load demo instead
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* What to upload */}
      <Card>
        <CardHeader><CardTitle>Supported File Types</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {[
              { icon: FolderOpen, label: "Metadata templates", desc: ".xml, .fmt — field definitions and editor layout" },
              { icon: FolderOpen, label: "Display templates", desc: ".xml — public display field configurations" },
              { icon: FolderOpen, label: "Quick lists", desc: ".xml, .csv, .txt — controlled vocabulary files" },
              { icon: FolderOpen, label: "Editor config", desc: ".ini, .cfg — FotoStation editor settings" },
              { icon: FolderOpen, label: "JSON configs", desc: ".json — any JSON-based config artifacts" },
              { icon: FolderOpen, label: "Text templates", desc: ".txt — plain-text caption/label templates" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex gap-2.5 p-2.5 rounded border border-[rgb(var(--border))]">
                <Icon className="w-4 h-4 text-[rgb(var(--muted))] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-xs">{label}</div>
                  <div className="text-[11px] text-[rgb(var(--muted))]">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Diagnostics after analysis */}
      {done && diagnostics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Analysis complete — Parse log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {diagnostics.map((d, i) => (
                <li key={i} className="flex items-start gap-2 py-1 text-xs border-b border-[rgb(var(--border))] last:border-0">
                  {d.status === "ok" ? <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />}
                  <span className="font-mono text-[11px] text-[rgb(var(--muted))] w-48 truncate flex-shrink-0">{d.filename}</span>
                  <StatusBadge status={d.status} />
                  <span className="text-[rgb(var(--muted))]">{d.message}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-3 border-t border-[rgb(var(--border))] flex gap-2">
              <Button onClick={() => router.push("/source")} size="sm">
                View source config →
              </Button>
              <Button variant="outline" onClick={() => router.push("/mapping")} size="sm">
                Go to mapping studio →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
