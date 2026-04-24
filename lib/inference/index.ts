import type {
  ParsedField,
  ParsedQuickList,
  ParsedTemplate,
  ResourceSpaceFieldProposal,
  MappingSuggestion,
  InferenceIssue,
  ConfidenceLevel,
  RSFieldType,
} from "@/types";
import { nanoid, slugify } from "@/lib/utils";
import { buildFieldTypeInference, inferSemanticTags } from "./field-type-map";

export interface InferenceResult {
  proposals: ResourceSpaceFieldProposal[];
  mappings: MappingSuggestion[];
  issues: InferenceIssue[];
}

export function runInference(
  fields: ParsedField[],
  quickLists: ParsedQuickList[],
  templates: ParsedTemplate[]
): InferenceResult {
  const proposals: ResourceSpaceFieldProposal[] = [];
  const mappings: MappingSuggestion[] = [];
  const issues: InferenceIssue[] = [];

  // Build quick-list lookup by name and by id
  const qlById = new Map(quickLists.map((ql) => [ql.id, ql]));
  const qlByName = new Map(quickLists.map((ql) => [ql.name.toLowerCase(), ql]));

  // Group fields by code to detect duplicates
  const fieldsByCode = new Map<string, ParsedField[]>();
  for (const field of fields) {
    const existing = fieldsByCode.get(field.code) ?? [];
    existing.push(field);
    fieldsByCode.set(field.code, existing);
  }

  // Detect display-only fields (appear in display template, NOT in editor templates)
  const editorFieldIds = new Set(
    templates
      .filter((t) => t.kind === "metadata" || t.kind === "editor")
      .flatMap((t) => t.fieldIds)
  );
  const displayFieldIds = new Set(
    templates
      .filter((t) => t.kind === "display")
      .flatMap((t) => t.fieldIds)
  );

  for (const field of fields) {
    // Resolve attached quick list
    const ql =
      (field.quickListRef ? qlById.get(field.quickListRef) ?? qlByName.get(field.quickListRef?.toLowerCase()) : null) ??
      fuzzyMatchQuickList(field, quickLists);

    const hasQuickList = !!ql;
    const inference = buildFieldTypeInference(field.code, field.label, field.fwFieldType, hasQuickList);

    // Determine whether field is display-only
    const isDisplayOnly = displayFieldIds.has(field.id) && !editorFieldIds.has(field.id);

    // Build suggested RS options from quick list
    const suggestedOptions = ql ? ql.values.map((v) => v.label || v.code) : [];

    // Detect conflicts
    const sameCodeFields = fieldsByCode.get(field.code) ?? [];
    const hasConflictingLabels =
      sameCodeFields.length > 1 &&
      new Set(sameCodeFields.map((f) => f.label.toLowerCase())).size > 1;

    const warnings: string[] = [];
    if (hasConflictingLabels) {
      warnings.push(`Field code "${field.code}" has conflicting labels across templates`);
    }
    if (isDisplayOnly) {
      warnings.push("This field appears only in display templates — it may not be editable in ResourceSpace");
    }
    if (inference.confidence === "low") {
      warnings.push("Field type is a low-confidence guess based on name pattern only");
    }
    if (!inference.iptcTag && !inference.xmpTag) {
      warnings.push("No IPTC/XMP tag mapping could be inferred — manual mapping may be required");
    }

    const suggestedName = slugify(field.label || field.code);
    const suggestedTitle = field.label || field.code;

    const confidence: ConfidenceLevel =
      warnings.length >= 2 ? "low" : inference.confidence === "high" && !hasConflictingLabels ? "high" : "medium";

    const proposal: ResourceSpaceFieldProposal = {
      id: nanoid("prp"),
      sourceFieldId: field.id,
      sourceLabel: field.label,
      sourceTypeGuess: inference.fwType,

      suggestedResourceSpaceName: suggestedName,
      suggestedResourceSpaceTitle: suggestedTitle,
      suggestedFieldType: inference.rsType,
      suggestedOptions,

      suggestedIptcTag: inference.iptcTag,
      suggestedXmpTag: inference.xmpTag,
      suggestedExifTag: inference.exifTag,

      includeInCsvExport: !isDisplayOnly,
      readOnlyCandidate: isDisplayOnly || field.readOnly,
      requiredCandidate: field.required,

      rationale: inference.rationale,
      confidence,
      evidence: field.evidence,
      status: confidence === "high" ? "proposed" : "needs_review",
      notes: field.notes.join("; "),
      warnings,
    };

    proposals.push(proposal);

    // Create mapping
    const mappingType =
      sameCodeFields.length > 1 ? "transformed" :
      isDisplayOnly ? "dropped" :
      "direct";

    mappings.push({
      id: nanoid("map"),
      sourceFieldId: field.id,
      proposalId: proposal.id,
      mappingType,
      lossWarning: isDisplayOnly
        ? "Display-only field — may not map directly to a ResourceSpace editable field"
        : hasConflictingLabels
        ? "Conflicting labels detected across source templates"
        : undefined,
      confidence,
      notes: warnings.join("; "),
    });
  }

  // Issue: fields with no quick list but named like a list
  const listNamePattern = /type|status|genre|category|medium|format|class/i;
  for (const field of fields) {
    if (listNamePattern.test(field.label) && !field.quickListRef && field.fwFieldType === "text") {
      issues.push({
        id: nanoid("iss"),
        severity: "warning",
        code: "POSSIBLE_LIST_FIELD",
        message: `Field "${field.label}" looks like it should be a controlled list but no quick list was found`,
        affectedFieldIds: [field.id],
        affectedArtifactIds: [field.sourceArtifactId],
        suggestedAction: "Check if there is a separate quick list file for this field and upload it",
      });
    }
  }

  // Issue: very large vocabulary (>100 values)
  for (const ql of quickLists) {
    if (ql.values.length > 100) {
      const relatedFields = fields.filter(
        (f) => f.quickListRef === ql.id || f.quickListRef === ql.name
      );
      issues.push({
        id: nanoid("iss"),
        severity: "info",
        code: "LARGE_VOCABULARY",
        message: `Quick list "${ql.displayName}" has ${ql.values.length} values — consider using a dynamic keyword list in ResourceSpace`,
        affectedFieldIds: relatedFields.map((f) => f.id),
        affectedArtifactIds: [ql.sourceArtifactId],
        suggestedAction: "Use ResourceSpace field type 'dynamic_keyword_list' for large controlled vocabularies",
      });
    }
  }

  // Issue: no templates found
  if (proposals.length === 0) {
    issues.push({
      id: nanoid("iss"),
      severity: "error",
      code: "NO_FIELDS_FOUND",
      message: "No fields could be extracted from the uploaded configuration files",
      affectedFieldIds: [],
      affectedArtifactIds: [],
      suggestedAction:
        "Verify that the uploaded files are FotoStation/FotoWare configuration files. Try uploading metadata templates (.fmt, .xml) or quick list files.",
    });
  }

  return { proposals, mappings, issues };
}

function fuzzyMatchQuickList(field: ParsedField, quickLists: ParsedQuickList[]): ParsedQuickList | null {
  const fieldKey = (field.code + " " + field.label).toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const ql of quickLists) {
    const qlKey = ql.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (fieldKey.includes(qlKey) || qlKey.includes(fieldKey.slice(0, 6))) {
      return ql;
    }
  }
  return null;
}
