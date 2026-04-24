import type {
  SourceArtifact,
  ParsedField,
  ParsedTemplate,
  ParsedQuickList,
  ParseDiagnostic,
  UploadedFile,
} from "@/types";
import { nanoid, sanitizeTextPreview, isoNow } from "@/lib/utils";
import { detectArtifactType, isTextFile, isSupportedFile } from "./detector";
import { parseQuickList } from "./quick-list-parser";
import { parseMetadataTemplate } from "./template-parser";
import {
  parseFsMetaPopupLists,
  parseFsGroups,
  parseFsTextImportFormat,
} from "./fotostation-parser";

// FotoStation app-config filenames — not metadata-relevant, skip gracefully
const FS_APP_CONFIG_NAMES = new Set([
  "fsactionitems.xml", "fsappearance.xml", "fsarchives.xml",
  "fscolormanagedata.xml", "fscropdata.xml", "fsextream.xml",
  "fsfilefilters.xml", "fsfolderlocation.xml", "fsimageactions.xml",
  "fsmarkerdata.xml", "fssearchhistory.xml", "fssystemdata.xml",
]);

// FotoStation editor-config filenames that use the groups parser
const FS_GROUPS_NAMES = new Set(["fsgroups.xml"]);
// FotoStation text-import format filenames
const FS_TEXT_IMPORT_NAMES = new Set(["fstextimportformat.xml"]);
// FotoStation popup list filenames
const FS_POPUP_LIST_NAMES = new Set(["fsmetapopuplists.xml", "fsmetaupdate.xml"]);

export interface ParseResult {
  artifacts: SourceArtifact[];
  fields: ParsedField[];
  templates: ParsedTemplate[];
  quickLists: ParsedQuickList[];
  diagnostics: ParseDiagnostic[];
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function parseUploadedFiles(files: UploadedFile[]): ParseResult {
  const artifacts: SourceArtifact[] = [];
  const allFields: ParsedField[] = [];
  const allTemplates: ParsedTemplate[] = [];
  const allQuickLists: ParsedQuickList[] = [];
  const diagnostics: ParseDiagnostic[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      diagnostics.push({
        filename: file.name,
        status: "error",
        message: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max allowed: 10 MB.`,
      });
      continue;
    }

    if (!isSupportedFile(file.name)) {
      diagnostics.push({ filename: file.name, status: "ignored", message: "Binary or unsupported file type — skipped." });
      continue;
    }

    const content = file.content;
    const detectedType = detectArtifactType(file.name, content);
    const artifactId = nanoid("art");

    const artifact: SourceArtifact = {
      id: artifactId,
      filename: file.name,
      relativePath: file.relativePath ?? file.name,
      sizeBytes: file.size,
      detectedType,
      parseStatus: "ok",
      parseWarnings: [],
      rawPreview: sanitizeTextPreview(content, 500),
    };

    try {
      const base = file.name.toLowerCase().split("/").pop() ?? file.name.toLowerCase();

      // ── FotoStation app-config: skip gracefully ─────────────────────────
      if (FS_APP_CONFIG_NAMES.has(base) || detectedType === "unknown") {
        artifact.parseStatus = "ignored";
        artifacts.push(artifact);
        diagnostics.push({
          filename: file.name,
          status: "ignored",
          message: "FotoStation application config — not metadata-relevant, skipped",
        });
        continue; // skip the push at the bottom of the loop
      }

      if (detectedType === "quick_list") {
        // FotoStation native popup list parser first; fall back to generic
        if (FS_POPUP_LIST_NAMES.has(base)) {
          const fsParsed = parseFsMetaPopupLists(artifact, content);
          if (fsParsed.length > 0) {
            allQuickLists.push(...fsParsed);
            const total = fsParsed.reduce((n, q) => n + q.values.length, 0);
            diagnostics.push({ filename: file.name, status: "ok", message: `FotoStation popup lists parsed: ${fsParsed.length} lists, ${total} values` });
          } else {
            artifact.parseStatus = "warning";
            diagnostics.push({ filename: file.name, status: "warning", message: "FotoStation popup list file parsed but no lists found" });
          }
        } else {
          const ql = parseQuickList(artifact, content);
          if (ql) {
            allQuickLists.push(ql);
            diagnostics.push({ filename: file.name, status: "ok", message: `Quick list parsed: ${ql.values.length} values` });
          }
        }
      } else if (detectedType === "editor_config") {
        // Route to the correct FotoStation parser by filename
        if (FS_GROUPS_NAMES.has(base)) {
          const { template, fields } = parseFsGroups(artifact, content);
          fields.forEach((f) => { f.templateId = template.id; });
          allTemplates.push(template);
          allFields.push(...fields);
          diagnostics.push({
            filename: file.name,
            status: fields.length > 0 ? "ok" : "warning",
            message: `FotoStation groups parsed: ${fields.length} fields, ${template.sections.length} sections`,
          });
        } else if (FS_TEXT_IMPORT_NAMES.has(base)) {
          const { fields } = parseFsTextImportFormat(artifact, content);
          allFields.push(...fields);
          diagnostics.push({
            filename: file.name,
            status: fields.length > 0 ? "ok" : "warning",
            message: `FotoStation text import format parsed: ${fields.length} fields`,
          });
        } else {
          // Generic editor config / unrecognised FS file
          const { template, fields } = parseMetadataTemplate(artifact, content);
          fields.forEach((f) => { f.templateId = template.id; });
          allTemplates.push(template);
          allFields.push(...fields);
          diagnostics.push({
            filename: file.name,
            status: fields.length > 0 ? "ok" : "warning",
            message: `Editor config parsed: ${fields.length} fields, ${template.sections.length} sections`,
          });
        }
      } else if (
        detectedType === "metadata_template" ||
        detectedType === "display_template" ||
        detectedType === "text_template"
      ) {
        const { template, fields } = parseMetadataTemplate(artifact, content);

        fields.forEach((f) => {
          f.templateId = template.id;
          if (detectedType === "display_template") {
            f.appearsInDisplay = true;
            f.appearsInEditor = false;
          }
        });

        allTemplates.push(template);
        allFields.push(...fields);
        diagnostics.push({
          filename: file.name,
          status: fields.length > 0 ? "ok" : "warning",
          message: `Template parsed: ${fields.length} fields, ${template.sections.length} sections`,
        });
      } else if (detectedType === "xml_config" || detectedType === "ini_config" || detectedType === "json_config") {
        // Try as template anyway
        const { template, fields } = parseMetadataTemplate(artifact, content);
        if (fields.length > 0) {
          allTemplates.push(template);
          allFields.push(...fields);
          diagnostics.push({ filename: file.name, status: "ok", message: `Config file parsed as template: ${fields.length} fields` });
        } else {
          artifact.parseStatus = "warning";
          artifact.parseWarnings.push("No structured fields found in this config file");
          diagnostics.push({ filename: file.name, status: "warning", message: "Config file parsed but no structured fields detected" });
        }
      } else {
        artifact.parseStatus = "warning";
        diagnostics.push({ filename: file.name, status: "warning", message: "File type unknown — included in inventory but not deeply parsed" });
      }
    } catch (err) {
      artifact.parseStatus = "error";
      artifact.parseWarnings.push(String(err));
      diagnostics.push({ filename: file.name, status: "error", message: `Parse error: ${String(err)}` });
    }

    artifacts.push(artifact);
  }

  // De-duplicate fields by code across templates
  const seenCodes = new Map<string, string>(); // code → first field id
  const deduped = allFields.filter((f) => {
    if (seenCodes.has(f.code)) {
      // Keep but mark as duplicate
      f.notes.push(`Also found in another artifact (field code "${f.code}" appears multiple times)`);
      return true; // keep all; duplicates become alt-labels candidates
    }
    seenCodes.set(f.code, f.id);
    return true;
  });

  return {
    artifacts,
    fields: deduped,
    templates: allTemplates,
    quickLists: allQuickLists,
    diagnostics,
  };
}
