import type {
  SourceConfigProject,
  ResourceSpaceFieldProposal,
  ExportBundle,
  ExportFile,
} from "@/types";
import { isoNow } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// JSON export
// ─────────────────────────────────────────────────────────────
function buildMappingReportJson(project: SourceConfigProject): string {
  const out = {
    meta: {
      generatedAt: isoNow(),
      projectId: project.id,
      projectName: project.name,
      isDemo: project.isDemo,
      tool: "FotoWare → ResourceSpace Setup Assistant",
    },
    stats: project.stats,
    artifacts: project.artifacts,
    fields: project.fields,
    templates: project.templates,
    quickLists: project.quickLists,
    proposals: project.proposals,
    mappings: project.mappings,
    issues: project.issues,
  };
  return JSON.stringify(out, null, 2);
}

// ─────────────────────────────────────────────────────────────
// CSV helpers
// ─────────────────────────────────────────────────────────────
function escCsv(val: string | boolean | number | undefined | null): string {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(cells: (string | boolean | number | undefined | null)[]): string {
  return cells.map(escCsv).join(",");
}

// ─────────────────────────────────────────────────────────────
// mapping-report.csv
// ─────────────────────────────────────────────────────────────
function buildMappingReportCsv(project: SourceConfigProject): string {
  const fieldMap = new Map(project.fields.map((f) => [f.id, f]));
  const header = csvRow([
    "Source File",
    "FW Field Code",
    "Source Label",
    "Source Type",
    "Example Values",
    "RS Field Name",
    "RS Field Title",
    "RS Field Type",
    "RS Options",
    "IPTC Tag",
    "XMP Tag",
    "Required",
    "Read-Only Candidate",
    "Include in CSV",
    "Confidence",
    "Status",
    "Warnings",
    "Rationale",
  ]);

  const rows = project.proposals.map((p) => {
    const field = fieldMap.get(p.sourceFieldId);
    const artifact = field ? project.artifacts.find((a) => a.id === field.sourceArtifactId) : null;
    return csvRow([
      artifact?.filename ?? "",
      field?.code ?? "",
      p.sourceLabel,
      p.sourceTypeGuess,
      field?.exampleValues?.join("; ") ?? "",
      p.suggestedResourceSpaceName,
      p.suggestedResourceSpaceTitle,
      p.suggestedFieldType,
      p.suggestedOptions.join("; "),
      p.suggestedIptcTag ?? "",
      p.suggestedXmpTag ?? "",
      p.requiredCandidate,
      p.readOnlyCandidate,
      p.includeInCsvExport,
      p.confidence,
      p.status,
      p.warnings.join("; "),
      p.rationale,
    ]);
  });

  return [header, ...rows].join("\n");
}

// ─────────────────────────────────────────────────────────────
// resourcespace-fields.csv
// ─────────────────────────────────────────────────────────────
function buildResourceSpaceFieldsCsv(project: SourceConfigProject): string {
  const header = csvRow([
    "Source Field",
    "Proposed Title",
    "Proposed Machine Name",
    "Proposed Type",
    "Options (semicolon-separated)",
    "Required",
    "Read Only Candidate",
    "Include in CSV Export",
    "IPTC Candidate",
    "XMP Candidate",
    "ExifTool Tag Candidate",
    "Confidence",
    "Rationale",
    "Warnings",
  ]);

  const rows = project.proposals
    .filter((p) => p.status !== "rejected")
    .map((p) =>
      csvRow([
        p.sourceLabel,
        p.suggestedResourceSpaceTitle,
        p.suggestedResourceSpaceName,
        p.suggestedFieldType,
        p.suggestedOptions.join("; "),
        p.requiredCandidate,
        p.readOnlyCandidate,
        p.includeInCsvExport,
        p.suggestedIptcTag ?? "",
        p.suggestedXmpTag ?? "",
        p.suggestedExifTag ?? "",
        p.confidence,
        p.rationale,
        p.warnings.join("; "),
      ])
    );

  return [header, ...rows].join("\n");
}

// ─────────────────────────────────────────────────────────────
// metadata-crosswalk.csv
// ─────────────────────────────────────────────────────────────
function buildMetadataCrosswalkCsv(project: SourceConfigProject): string {
  const fieldMap = new Map(project.fields.map((f) => [f.id, f]));

  const header = csvRow([
    "FW Field Code",
    "FW Label",
    "FW Type",
    "RS Field Name",
    "RS Type",
    "Mapping Type",
    "IPTC",
    "XMP",
    "ExifTool",
    "Loss Warning",
    "Confidence",
  ]);

  const rows = project.mappings.map((m) => {
    const field = fieldMap.get(m.sourceFieldId);
    const proposal = project.proposals.find((p) => p.id === m.proposalId);
    return csvRow([
      field?.code ?? "",
      field?.label ?? "",
      field?.fwFieldType ?? "",
      proposal?.suggestedResourceSpaceName ?? "",
      proposal?.suggestedFieldType ?? "",
      m.mappingType,
      proposal?.suggestedIptcTag ?? "",
      proposal?.suggestedXmpTag ?? "",
      proposal?.suggestedExifTag ?? "",
      m.lossWarning ?? "",
      m.confidence,
    ]);
  });

  return [header, ...rows].join("\n");
}

// ─────────────────────────────────────────────────────────────
// sample-import.csv
// ─────────────────────────────────────────────────────────────
function buildSampleImportCsv(project: SourceConfigProject): string {
  const exportFields = project.proposals.filter(
    (p) => p.includeInCsvExport && p.status !== "rejected"
  );

  if (exportFields.length === 0) return "No fields flagged for CSV export";

  const header = csvRow(exportFields.map((p) => p.suggestedResourceSpaceTitle));

  // Build two example rows with placeholder values
  const placeholderRow1 = csvRow(
    exportFields.map((p) => {
      switch (p.suggestedFieldType) {
        case "date": return "2024-01-15";
        case "integer": return "1";
        case "dropdown": return p.suggestedOptions[0] ?? "Example Value";
        case "check_box_list": return p.suggestedOptions.slice(0, 2).join("; ");
        case "keyword_list": return "keyword1; keyword2";
        case "textarea": return "Example descriptive text for this field.";
        default: return `Example ${p.suggestedResourceSpaceTitle}`;
      }
    })
  );

  const placeholderRow2 = csvRow(
    exportFields.map((p) => {
      switch (p.suggestedFieldType) {
        case "date": return "2023-06-30";
        case "integer": return "2";
        case "dropdown": return p.suggestedOptions[1] ?? p.suggestedOptions[0] ?? "Another Value";
        case "check_box_list": return p.suggestedOptions.slice(1, 3).join("; ");
        case "keyword_list": return "keyword3; keyword4; keyword5";
        case "textarea": return "Second example description text.";
        default: return `Another ${p.suggestedResourceSpaceTitle}`;
      }
    })
  );

  return [header, placeholderRow1, placeholderRow2].join("\n");
}

// ─────────────────────────────────────────────────────────────
// setup-report.md
// ─────────────────────────────────────────────────────────────
function buildSetupReportMd(project: SourceConfigProject): string {
  const now = new Date().toLocaleDateString("en-GB", {
    year: "numeric", month: "long", day: "numeric",
  });

  const highConfidence = project.proposals.filter((p) => p.confidence === "high").length;
  const medConfidence = project.proposals.filter((p) => p.confidence === "medium").length;
  const lowConfidence = project.proposals.filter((p) => p.confidence === "low").length;
  const warnings = project.issues.filter((i) => i.severity === "warning");
  const errors = project.issues.filter((i) => i.severity === "error");

  const artifactList = project.artifacts
    .map((a) => `- **${a.filename}** — ${a.detectedType.replace(/_/g, " ")} (${a.parseStatus})`)
    .join("\n");

  const fieldList = project.proposals
    .map(
      (p) =>
        `| ${p.sourceLabel} | \`${p.suggestedResourceSpaceName}\` | ${p.suggestedFieldType} | ${p.suggestedIptcTag ?? "—"} | ${p.confidence} |`
    )
    .join("\n");

  const issueList = project.issues
    .map((i) => `- **[${i.severity.toUpperCase()}]** ${i.message}\n  → *${i.suggestedAction}*`)
    .join("\n\n");

  const manualChecklist = [
    "[ ] Review all low-confidence field mappings in the Mapping Studio",
    "[ ] Verify controlled vocabulary lists are complete before import",
    "[ ] Configure ResourceSpace field display groups to mirror FotoStation editor sections",
    "[ ] Set up ExifTool mapping in ResourceSpace settings for embedded metadata read/write",
    "[ ] Test a sample CSV import with the provided sample-import.csv template",
    "[ ] Configure ResourceSpace user permissions and access control",
    "[ ] Set up search indices for keyword fields",
    "[ ] Review and adjust field ordering in ResourceSpace to match editorial workflow",
    "[ ] Configure any multi-language labels if required",
    "[ ] Document any custom display templates that could not be replicated",
  ].join("\n");

  return `# ResourceSpace Setup Report

**Generated:** ${now}
**Project:** ${project.name}
**Source:** FotoWare / FotoStation configuration analysis
**Tool:** FotoWare → ResourceSpace Setup Assistant

---

## Executive Summary

This report documents the analysis of a FotoWare/FotoStation configuration export and provides
proposed field mappings and setup recommendations for ResourceSpace.

- **${project.artifacts.length}** configuration files analyzed
- **${project.fields.length}** fields detected across all templates
- **${project.templates.length}** metadata/display templates found
- **${project.quickLists.length}** quick lists (controlled vocabularies) detected
- **${project.proposals.length}** ResourceSpace field proposals generated
  - High confidence: ${highConfidence}
  - Medium confidence: ${medConfidence}
  - Low confidence: ${lowConfidence} *(require manual review)*
- **${errors.length}** errors, **${warnings.length}** warnings requiring attention

---

## Source File Inventory

The following files were uploaded and analyzed:

${artifactList || "No artifacts recorded."}

---

## Fields and Templates Found

The following fields were extracted and proposed for ResourceSpace configuration:

| Source Label | RS Field Name | RS Type | IPTC Tag | Confidence |
|---|---|---|---|---|
${fieldList || "| — | — | — | — | — |"}

---

## Recommended ResourceSpace Setup

### Field Configuration

For each proposed field, add the following in ResourceSpace under **System → Manage metadata fields**:

1. Create a new field with the proposed machine name as the "ref" identifier
2. Set the display title as shown in the mapping
3. Select the appropriate field type
4. If options are listed, add them as allowed values
5. Configure read/write mapping using the IPTC/XMP tag candidates where provided

### Metadata Mapping (ExifTool)

ResourceSpace uses ExifTool for embedded metadata read/write. The mapping candidates are listed
in \`metadata-crosswalk.csv\`. For each field with an IPTC or XMP tag:

1. Go to **System → Manage metadata fields** in ResourceSpace
2. Select the field
3. Set the "ExifTool/IPTC/XMP field" value to the suggested tag

---

## Unresolved Questions

${issueList || "No issues flagged."}

---

## Manual Follow-Up Checklist

The following steps **cannot** be automated and require manual admin attention:

${manualChecklist}

---

## Assumptions

- All field codes and labels are taken from the uploaded configuration files. FotoWare internal
  field numbering (e.g. field 5 = title) was not used unless explicitly present in the files.
- IPTC/XMP tag suggestions are heuristic; exact ExifTool field names in your ResourceSpace
  installation may differ depending on the ExifTool version and active tag groups.
- Quick list values are proposed as ResourceSpace field options; hierarchical vocabularies
  are flattened to a single level.
- Display-only template fields are flagged as "read-only candidates" — ResourceSpace may not
  support the same display logic, and custom solutions may be needed.
- This report does not cover ResourceSpace user groups, access control, or portal configuration.

---

## About This Report

This report was generated by the **FotoWare → ResourceSpace Setup Assistant**, a guided analysis
tool for DAM migrations. It is a starting point for configuration, not a complete automated migration.
Human review of all low-confidence mappings is strongly recommended before implementing in production.
`;
}

// ─────────────────────────────────────────────────────────────
// Main export bundle builder
// ─────────────────────────────────────────────────────────────
export function buildExportBundle(project: SourceConfigProject): ExportBundle {
  const files: ExportFile[] = [
    {
      filename: "mapping-report.json",
      mimeType: "application/json",
      content: buildMappingReportJson(project),
    },
    {
      filename: "mapping-report.csv",
      mimeType: "text/csv",
      content: buildMappingReportCsv(project),
    },
    {
      filename: "resourcespace-fields.csv",
      mimeType: "text/csv",
      content: buildResourceSpaceFieldsCsv(project),
    },
    {
      filename: "metadata-crosswalk.csv",
      mimeType: "text/csv",
      content: buildMetadataCrosswalkCsv(project),
    },
    {
      filename: "sample-import.csv",
      mimeType: "text/csv",
      content: buildSampleImportCsv(project),
    },
    {
      filename: "setup-report.md",
      mimeType: "text/markdown",
      content: buildSetupReportMd(project),
    },
  ];

  return {
    generatedAt: isoNow(),
    projectId: project.id,
    files,
  };
}

export function downloadFile(filename: string, mimeType: string, content: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
