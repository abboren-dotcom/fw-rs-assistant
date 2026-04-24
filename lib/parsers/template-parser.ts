import type {
  ParsedTemplate,
  ParsedField,
  ParsedEditorSection,
  SourceArtifact,
  FWFieldType,
  ConfidenceLevel,
} from "@/types";
import { nanoid } from "@/lib/utils";

export interface TemplateParseResult {
  template: ParsedTemplate;
  fields: ParsedField[];
}

export function parseMetadataTemplate(artifact: SourceArtifact, content: string): TemplateParseResult {
  const lower = content.slice(0, 300).toLowerCase();

  if (lower.includes("<?xml") || lower.includes("<template") || lower.includes("<metadata")) {
    return parseXmlTemplate(artifact, content);
  }
  if (content.includes("[") && content.includes("]")) {
    return parseIniTemplate(artifact, content);
  }
  return parseTextTemplate(artifact, content);
}

// ── XML template parser ────────────────────────────────────────────────────

function parseXmlTemplate(artifact: SourceArtifact, content: string): TemplateParseResult {
  const fields: ParsedField[] = [];
  const sections: ParsedEditorSection[] = [];
  const notes: string[] = [];

  const templateNameMatch = content.match(/name=["']([^"']+)["']/i);
  const templateName = templateNameMatch ? templateNameMatch[1] : artifact.filename.replace(/\.[^.]+$/, "");

  // Parse sections
  const sectionMatches = [...content.matchAll(/<section[^>]*label=["']([^"']+)["'][^>]*>([\s\S]*?)<\/section>/gi)];
  let sectionSortOrder = 0;

  for (const sm of sectionMatches) {
    const sectionLabel = sm[1];
    const sectionContent = sm[2];
    const sectionId = nanoid("sec");
    const sectionFieldIds: string[] = [];

    const fieldMatches = extractXmlFields(artifact, sectionContent, sectionId, fields.length);
    fieldMatches.forEach((f) => {
      f.id = nanoid("fld");
      sectionFieldIds.push(f.id);
      fields.push(f);
    });

    sections.push({
      id: sectionId,
      label: sectionLabel,
      fieldIds: sectionFieldIds,
      collapsed: false,
      sortOrder: sectionSortOrder++,
    });
  }

  // If no sections, parse fields at root level
  if (sections.length === 0) {
    const rootFields = extractXmlFields(artifact, content, undefined, 0);
    rootFields.forEach((f) => {
      f.id = nanoid("fld");
      fields.push(f);
    });
    if (fields.length > 0) {
      sections.push({
        id: nanoid("sec"),
        label: "General",
        fieldIds: fields.map((f) => f.id),
        collapsed: false,
        sortOrder: 0,
      });
    }
  }

  const template: ParsedTemplate = {
    id: nanoid("tpl"),
    sourceArtifactId: artifact.id,
    name: templateName,
    kind: artifact.detectedType === "display_template" ? "display" : "metadata",
    fieldIds: fields.map((f) => f.id),
    sections,
    confidence: fields.length > 0 ? "high" : "low",
    notes,
  };

  return { template, fields };
}

function extractXmlFields(
  artifact: SourceArtifact,
  content: string,
  sectionId: string | undefined,
  baseSort: number
): ParsedField[] {
  const fields: ParsedField[] = [];

  // Patterns: <field>, <metadata>, <property>, <element>
  const fieldMatches = [
    ...content.matchAll(/<(field|metadata|property|element)([^>]*)>([\s\S]*?)<\/\1>/gi),
  ];

  fieldMatches.forEach((m, i) => {
    const attrs = m[2];
    const inner = m[3];

    const codeAttr = attrs.match(/(?:code|name|id|tag)=["']([^"']+)["']/i);
    const labelAttr = attrs.match(/(?:label|title|caption|displayname)=["']([^"']+)["']/i);
    const typeAttr = attrs.match(/(?:type|fieldtype|datatype)=["']([^"']+)["']/i);
    const requiredAttr = attrs.match(/required=["']?(true|yes|1)["']?/i);
    const readonlyAttr = attrs.match(/readonly=["']?(true|yes|1)["']?/i);
    const listAttr = attrs.match(/list=["']([^"']+)["']/i);

    // Also look in child elements
    const codeInner = inner.match(/<code[^>]*>([^<]+)<\/code>/i);
    const labelInner = inner.match(/<label[^>]*>([^<]+)<\/label>|<title[^>]*>([^<]+)<\/title>/i);
    const typeInner = inner.match(/<type[^>]*>([^<]+)<\/type>/i);

    const code = codeAttr?.[1] ?? codeInner?.[1] ?? `field_${baseSort + i}`;
    const label = labelAttr?.[1] ?? labelInner?.[1] ?? labelInner?.[2] ?? code;
    const typeStr = typeAttr?.[1] ?? typeInner?.[1];

    fields.push({
      id: "",
      sourceArtifactId: artifact.id,
      templateId: sectionId,
      code,
      label,
      altLabels: [],
      fwFieldType: guessFieldType(code, label, typeStr),
      quickListRef: listAttr?.[1],
      required: !!requiredAttr,
      readOnly: !!readonlyAttr,
      multiValue: /multi|list|keyword/i.test(typeStr ?? ""),
      exampleValues: [],
      appearsInEditor: true,
      appearsInDisplay: artifact.detectedType === "display_template",
      sortOrder: baseSort + i,
      confidence: codeAttr ? "high" : "medium",
      evidence: "parsed",
      notes: [],
      rawSnippet: m[0].slice(0, 200),
    });
  });

  return fields;
}

// ── INI template parser ────────────────────────────────────────────────────

function parseIniTemplate(artifact: SourceArtifact, content: string): TemplateParseResult {
  const lines = content.split(/\r?\n/);
  const fields: ParsedField[] = [];
  const sections: ParsedEditorSection[] = [];
  let currentSection: ParsedEditorSection | null = null;
  let sortOrder = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith(";") || line.startsWith("#")) continue;

    const sectionMatch = line.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        id: nanoid("sec"),
        label: sectionMatch[1],
        fieldIds: [],
        collapsed: false,
        sortOrder: sections.length,
      };
      continue;
    }

    const kvMatch = line.match(/^([^=]+)=(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim();
      const value = kvMatch[2].trim();

      // Treat key-value pairs as field definitions
      const fieldId = nanoid("fld");
      const field: ParsedField = {
        id: fieldId,
        sourceArtifactId: artifact.id,
        templateId: currentSection?.id,
        code: key,
        label: formatLabel(key),
        altLabels: [],
        fwFieldType: guessFieldType(key, value, undefined),
        required: false,
        readOnly: false,
        multiValue: false,
        exampleValues: value ? [value] : [],
        appearsInEditor: true,
        appearsInDisplay: false,
        sortOrder: sortOrder++,
        confidence: "medium",
        evidence: "parsed",
        notes: [],
        rawSnippet: line,
      };
      fields.push(field);
      currentSection?.fieldIds.push(fieldId);
    }
  }

  if (currentSection) sections.push(currentSection);

  const template: ParsedTemplate = {
    id: nanoid("tpl"),
    sourceArtifactId: artifact.id,
    name: artifact.filename.replace(/\.[^.]+$/, ""),
    kind: "metadata",
    fieldIds: fields.map((f) => f.id),
    sections,
    confidence: fields.length > 0 ? "medium" : "low",
    notes: ["Parsed as INI-style configuration; field types are inferred"],
  };

  return { template, fields };
}

// ── Plain text template parser ─────────────────────────────────────────────

function parseTextTemplate(artifact: SourceArtifact, content: string): TemplateParseResult {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  const fields: ParsedField[] = [];

  lines.forEach((line, i) => {
    const clean = line.trim();
    if (!clean || clean.startsWith("#")) return;

    // Look for "Label: value" or "FIELD_CODE" patterns
    const colonMatch = clean.match(/^([^:]+):\s*(.*)$/);
    const code = colonMatch ? colonMatch[1].trim() : clean;
    const exampleVal = colonMatch?.[2] ?? "";

    fields.push({
      id: nanoid("fld"),
      sourceArtifactId: artifact.id,
      code,
      label: formatLabel(code),
      altLabels: [],
      fwFieldType: guessFieldType(code, exampleVal, undefined),
      required: false,
      readOnly: false,
      multiValue: false,
      exampleValues: exampleVal ? [exampleVal] : [],
      appearsInEditor: true,
      appearsInDisplay: false,
      sortOrder: i,
      confidence: "low",
      evidence: "inferred",
      notes: ["Extracted from plain-text template; low confidence"],
      rawSnippet: clean,
    });
  });

  const template: ParsedTemplate = {
    id: nanoid("tpl"),
    sourceArtifactId: artifact.id,
    name: artifact.filename.replace(/\.[^.]+$/, ""),
    kind: "text",
    fieldIds: fields.map((f) => f.id),
    sections: fields.length > 0
      ? [{ id: nanoid("sec"), label: "Fields", fieldIds: fields.map((f) => f.id), collapsed: false, sortOrder: 0 }]
      : [],
    confidence: "low",
    notes: ["Parsed as plain text; accuracy depends on file format"],
  };

  return { template, fields };
}

// ── Helpers ────────────────────────────────────────────────────────────────

const DATE_HINTS = /date|dato|år|year|created|shot|recorded|accession|copyright.*year/i;
const LONG_TEXT_HINTS = /description|caption|note|comment|summary|abstract|biography|narrative/i;
const PERSON_HINTS = /photographer|creator|author|byline|credit|artist|illustrator|person|kontakt/i;
const KEYWORD_HINTS = /keyword|tag|subject|topic|kategori|category/i;
const DROPDOWN_HINTS = /type|status|genre|format|medium|classification|class|group/i;
const NUMBER_HINTS = /number|nr|id|count|quantity|weight|height|width|size/i;

export function guessFieldType(code: string, labelOrValue: string, typeStr?: string): FWFieldType {
  const combined = `${code} ${labelOrValue}`.toLowerCase();

  if (typeStr) {
    const t = typeStr.toLowerCase();
    if (t.includes("date")) return "date";
    if (t.includes("text") && t.includes("long")) return "longtext";
    if (t.includes("text") || t.includes("string")) return "text";
    if (t.includes("list") || t.includes("select") || t.includes("dropdown") || t.includes("combo")) return "dropdown";
    if (t.includes("multi")) return "multiselect";
    if (t.includes("keyword")) return "keyword";
    if (t.includes("int") || t.includes("number") || t.includes("num")) return "number";
    if (t.includes("bool") || t.includes("check")) return "boolean";
    if (t.includes("person") || t.includes("contact")) return "person";
    if (t.includes("url") || t.includes("link")) return "url";
  }

  if (DATE_HINTS.test(combined)) return "date";
  if (LONG_TEXT_HINTS.test(combined)) return "longtext";
  if (PERSON_HINTS.test(combined)) return "person";
  if (KEYWORD_HINTS.test(combined)) return "keyword";
  if (DROPDOWN_HINTS.test(combined)) return "dropdown";
  if (NUMBER_HINTS.test(combined)) return "number";

  return "text";
}

function formatLabel(code: string): string {
  return code
    .replace(/[_\-.]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}
