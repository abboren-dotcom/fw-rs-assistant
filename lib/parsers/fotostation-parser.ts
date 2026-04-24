/**
 * FotoStation native XML format parser.
 *
 * FotoStation uses its own XML schema that differs from generic metadata
 * template formats. This module handles the key FotoStation config files:
 *
 *   fsMetaPopupLists.xml  — popup (quick) lists per field number
 *   fsGroups.xml          — editor field groups / sections
 *   fsTextImportFormat.xml — text import field mapping (field→label)
 */

import type {
  ParsedQuickList,
  ParsedField,
  ParsedTemplate,
  ParsedEditorSection,
  SourceArtifact,
  FWFieldType,
} from "@/types";
import { nanoid } from "@/lib/utils";
import { guessFieldType } from "./template-parser";

// ── IPTC field number → semantic label map ────────────────────────────────
// FotoStation uses standard IPTC field numbers internally.
export const FS_FIELD_MAP: Record<number, { label: string; type: FWFieldType }> = {
  5:   { label: "Object Name / Title",         type: "text" },
  7:   { label: "Edit Status",                 type: "text" },
  10:  { label: "Urgency",                     type: "dropdown" },
  15:  { label: "Category",                    type: "dropdown" },
  20:  { label: "Supplemental Categories",     type: "multiselect" },
  22:  { label: "Fixture Identifier",          type: "text" },
  25:  { label: "Keywords",                    type: "keyword" },
  30:  { label: "Release Date",                type: "date" },
  35:  { label: "Release Time",                type: "text" },
  37:  { label: "Expiration Date",             type: "date" },
  40:  { label: "Special Instructions",        type: "longtext" },
  45:  { label: "Reference Service",           type: "text" },
  47:  { label: "Reference Date",              type: "date" },
  50:  { label: "Reference Number",            type: "text" },
  55:  { label: "Date Created",                type: "date" },
  60:  { label: "Time Created",                type: "text" },
  62:  { label: "Digital Creation Date",       type: "date" },
  65:  { label: "Originating Program",         type: "text" },
  70:  { label: "Program Version",             type: "text" },
  75:  { label: "Object Cycle",                type: "dropdown" },
  80:  { label: "Creator / By-line",           type: "person" },
  85:  { label: "Creator Title / By-line Title", type: "text" },
  90:  { label: "City",                        type: "text" },
  92:  { label: "Sub-location",                type: "text" },
  95:  { label: "Province / State",            type: "text" },
  100: { label: "Country Code",                type: "text" },
  101: { label: "Country",                     type: "text" },
  103: { label: "Original Transmission Reference", type: "text" },
  105: { label: "Headline",                    type: "text" },
  110: { label: "Credit",                      type: "person" },
  115: { label: "Source",                      type: "text" },
  116: { label: "Copyright Notice",            type: "text" },
  118: { label: "Contact",                     type: "text" },
  120: { label: "Caption / Abstract",          type: "longtext" },
  122: { label: "Caption Writer",              type: "person" },
  125: { label: "Rasterized Caption",          type: "text" },
  130: { label: "Image Type",                  type: "dropdown" },
  131: { label: "Image Orientation",           type: "dropdown" },
  135: { label: "Language Identifier",         type: "text" },
  150: { label: "Audio Type",                  type: "dropdown" },
  151: { label: "Audio Sampling Rate",         type: "number" },
  200: { label: "Subfile Format",              type: "dropdown" },
  201: { label: "Subfile Format Version",      type: "number" },
  202: { label: "Object Preview File Format",  type: "dropdown" },
  // FotoStation custom / XMP extension range
  300: { label: "Custom Field 300",            type: "text" },
  301: { label: "Custom Field 301",            type: "text" },
  302: { label: "Custom Field 302",            type: "text" },
  303: { label: "Custom Field 303",            type: "text" },
  304: { label: "Custom Field 304",            type: "text" },
  305: { label: "Custom Field 305",            type: "text" },
};

export function getFieldInfo(fieldNumber: number, customLabel?: string): { label: string; type: FWFieldType } {
  const known = FS_FIELD_MAP[fieldNumber];
  if (customLabel && customLabel.trim()) {
    // Prefer the custom label from the config but keep the known type
    return { label: customLabel.trim(), type: known?.type ?? guessFieldType(String(fieldNumber), customLabel, undefined) };
  }
  return known ?? { label: `Field ${fieldNumber}`, type: "text" };
}

// ── fsMetaPopupLists.xml parser ───────────────────────────────────────────
// Structure (typical):
//   <FsMetaPopupLists>
//     <PopupList fieldNumber="80" fieldName="Creator">
//       <Item>Anders Haakon</Item>
//       <Item>Marie Svensson</Item>
//     </PopupList>
//   </FsMetaPopupLists>
//
// Variations observed: <List>, <Entries>, <Entry>, <Value>, <ListItem>

export function parseFsMetaPopupLists(artifact: SourceArtifact, content: string): ParsedQuickList[] {
  const lists: ParsedQuickList[] = [];

  // Match every <PopupList ...> ... </PopupList> block (case-insensitive tag variants)
  const blockRe = /<(PopupList|List|MetaList|MetaPopupList)([^>]*)>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRe.exec(content)) !== null) {
    const attrs = match[2];
    const inner = match[3];

    const fieldNumAttr = attrs.match(/fieldNumber\s*=\s*["']?(\d+)["']?/i);
    const fieldNameAttr = attrs.match(/(?:fieldName|name|label)\s*=\s*["']([^"']+)["']/i);
    const listNameAttr  = attrs.match(/listName\s*=\s*["']([^"']+)["']/i);

    const fieldNumber = fieldNumAttr ? parseInt(fieldNumAttr[1], 10) : NaN;
    const fieldInfo = isNaN(fieldNumber)
      ? { label: fieldNameAttr?.[1] ?? listNameAttr?.[1] ?? "Unknown List", type: "text" as FWFieldType }
      : getFieldInfo(fieldNumber, fieldNameAttr?.[1]);

    const displayName = listNameAttr?.[1] ?? fieldInfo.label;

    // Extract values from child elements
    const values = extractListValues(inner);
    if (values.length === 0) continue;

    const name = slugify(displayName || `field_${fieldNumber}`);
    lists.push({
      id: nanoid("ql"),
      sourceArtifactId: artifact.id,
      name,
      displayName,
      values,
      confidence: !isNaN(fieldNumber) ? "high" : "medium",
      notes: !isNaN(fieldNumber)
        ? [`IPTC field number ${fieldNumber}`]
        : ["Field number not found; matched by name"],
    });
  }

  // If nothing matched with block pattern, try a flat <Item> list
  if (lists.length === 0) {
    const flatValues = extractListValues(content);
    if (flatValues.length > 0) {
      lists.push({
        id: nanoid("ql"),
        sourceArtifactId: artifact.id,
        name: slugify(artifact.filename.replace(/\.[^.]+$/, "")),
        displayName: artifact.filename.replace(/\.[^.]+$/, ""),
        values: flatValues,
        confidence: "low",
        notes: ["Flat list structure — no field number found"],
      });
    }
  }

  return lists;
}

function extractListValues(inner: string): Array<{ code: string; label: string; sortOrder: number }> {
  // Try <Item>, <Entry>, <Value>, <ListItem>, <option>, <term>
  const tagRe = /<(?:Item|Entry|Value|ListItem|option|term|row)[^>]*>([^<]+)<\/(?:Item|Entry|Value|ListItem|option|term|row)>/gi;
  const results: Array<{ code: string; label: string; sortOrder: number }> = [];
  let m: RegExpExecArray | null;
  let i = 0;

  while ((m = tagRe.exec(inner)) !== null) {
    const val = m[1].trim();
    if (val) results.push({ code: val, label: val, sortOrder: i++ });
  }

  // Also try attribute-based values: <Item value="x" label="y"/>
  if (results.length === 0) {
    const attrRe = /<(?:Item|Entry|Value|option)[^>]+(?:value|code)\s*=\s*["']([^"']+)["'][^>]*(?:label|name)\s*=\s*["']([^"']+)["'][^>]*/gi;
    while ((m = attrRe.exec(inner)) !== null) {
      results.push({ code: m[1].trim(), label: m[2].trim(), sortOrder: i++ });
    }
  }

  return results;
}

// ── fsGroups.xml parser ───────────────────────────────────────────────────
// Structure (typical):
//   <FsGroups>
//     <Group name="Identification" expanded="true">
//       <Field number="5"/>
//       <Field number="80"/>
//     </Group>
//   </FsGroups>

export interface FsGroupParseResult {
  template: ParsedTemplate;
  fields: ParsedField[];
}

export function parseFsGroups(artifact: SourceArtifact, content: string): FsGroupParseResult {
  const fields: ParsedField[] = [];
  const sections: ParsedEditorSection[] = [];
  let sectionSort = 0;

  const groupRe = /<Group([^>]*)>([\s\S]*?)<\/Group>/gi;
  let gm: RegExpExecArray | null;

  while ((gm = groupRe.exec(content)) !== null) {
    const gAttrs = gm[1];
    const gInner = gm[2];

    const nameAttr = gAttrs.match(/(?:name|label|title)\s*=\s*["']([^"']+)["']/i);
    const sectionLabel = nameAttr?.[1] ?? `Group ${sectionSort + 1}`;
    const sectionId = nanoid("sec");
    const sectionFieldIds: string[] = [];

    // Extract field numbers from <Field number="x"/> or <FieldRef fieldNumber="x"/>
    const fieldRe = /<(?:Field|FieldRef|Item)([^>]*(?:number|fieldNumber|id)\s*=\s*["']?(\d+)["']?)[^>]*\/?>/gi;
    let fm: RegExpExecArray | null;

    while ((fm = fieldRe.exec(gInner)) !== null) {
      const numStr = fm[0].match(/(?:number|fieldNumber|id)\s*=\s*["']?(\d+)["']?/i)?.[1];
      if (!numStr) continue;
      const num = parseInt(numStr, 10);
      const info = getFieldInfo(num);
      const fieldId = nanoid("fld");

      fields.push({
        id: fieldId,
        sourceArtifactId: artifact.id,
        templateId: sectionId,
        code: String(num),
        label: info.label,
        altLabels: [],
        fwFieldType: info.type,
        required: false,
        readOnly: false,
        multiValue: info.type === "keyword" || info.type === "multiselect",
        exampleValues: [],
        appearsInEditor: true,
        appearsInDisplay: false,
        sortOrder: fields.length,
        confidence: FS_FIELD_MAP[num] ? "high" : "medium",
        evidence: "parsed",
        notes: [`IPTC field number ${num}`],
        rawSnippet: fm[0],
      });
      sectionFieldIds.push(fieldId);
    }

    if (sectionFieldIds.length > 0) {
      sections.push({
        id: sectionId,
        label: sectionLabel,
        fieldIds: sectionFieldIds,
        collapsed: false,
        sortOrder: sectionSort++,
      });
    }
  }

  const template: ParsedTemplate = {
    id: nanoid("tpl"),
    sourceArtifactId: artifact.id,
    name: "FotoStation Editor Groups",
    kind: "metadata",
    fieldIds: fields.map((f) => f.id),
    sections,
    confidence: fields.length > 0 ? "high" : "low",
    notes: fields.length === 0
      ? ["fsGroups.xml parsed but no field numbers found — the file may use a different schema version"]
      : [],
  };

  return { template, fields };
}

// ── fsTextImportFormat.xml parser ─────────────────────────────────────────
// Maps text-import columns to field numbers / labels
// Structure varies; look for <Field number="x" label="y"/> patterns

export interface FsTextImportResult {
  fields: ParsedField[];
}

export function parseFsTextImportFormat(artifact: SourceArtifact, content: string): FsTextImportResult {
  const fields: ParsedField[] = [];

  const fieldRe = /<(?:Field|Column|Entry)([^>]*)(?:\/>|>[\s\S]*?<\/(?:Field|Column|Entry)>)/gi;
  let m: RegExpExecArray | null;

  while ((m = fieldRe.exec(content)) !== null) {
    const attrs = m[1];
    const numAttr = attrs.match(/(?:number|fieldNumber|id)\s*=\s*["']?(\d+)["']?/i);
    const labelAttr = attrs.match(/(?:label|name|title)\s*=\s*["']([^"']+)["']/i);

    if (!numAttr && !labelAttr) continue;

    const num = numAttr ? parseInt(numAttr[1], 10) : NaN;
    const info = isNaN(num)
      ? { label: labelAttr![1], type: "text" as FWFieldType }
      : getFieldInfo(num, labelAttr?.[1]);

    fields.push({
      id: nanoid("fld"),
      sourceArtifactId: artifact.id,
      code: isNaN(num) ? slugify(info.label) : String(num),
      label: info.label,
      altLabels: [],
      fwFieldType: info.type,
      required: false,
      readOnly: false,
      multiValue: false,
      exampleValues: [],
      appearsInEditor: true,
      appearsInDisplay: false,
      sortOrder: fields.length,
      confidence: !isNaN(num) && FS_FIELD_MAP[num] ? "high" : "medium",
      evidence: "parsed",
      notes: ["Extracted from text import format definition"],
      rawSnippet: m[0].slice(0, 200),
    });
  }

  return { fields };
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}
