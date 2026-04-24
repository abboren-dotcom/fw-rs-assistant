// ============================================================
// Core domain types for FotoWare → ResourceSpace Setup Assistant
// ============================================================

export type ConfidenceLevel = "high" | "medium" | "low";
export type EvidenceKind = "parsed" | "inferred" | "manual";
export type ParseStatus = "ok" | "warning" | "error" | "ignored";

export type FWFieldType =
  | "text"
  | "longtext"
  | "date"
  | "number"
  | "dropdown"
  | "multiselect"
  | "keyword"
  | "person"
  | "boolean"
  | "url"
  | "unknown";

export type RSFieldType =
  | "text"
  | "textarea"
  | "date"
  | "integer"
  | "float"
  | "dropdown"
  | "check_box_list"
  | "radio_buttons"
  | "keyword_list"
  | "access"
  | "image"
  | "resource_type"
  | "search_bar"
  | "dynamic_keyword_list"
  | "upload_plupload"
  | "date_range";

// ────────────────────────────────────────────────
// Source artifact — a file parsed from the upload
// ────────────────────────────────────────────────
export interface SourceArtifact {
  id: string;
  filename: string;
  relativePath: string;
  sizeBytes: number;
  detectedType:
    | "metadata_template"
    | "display_template"
    | "text_template"
    | "quick_list"
    | "editor_config"
    | "xml_config"
    | "ini_config"
    | "csv_data"
    | "json_config"
    | "unknown";
  parseStatus: ParseStatus;
  parseWarnings: string[];
  rawPreview: string; // first ~500 chars, sanitized
}

// ────────────────────────────────────────────────
// Parsed quick list (controlled vocabulary)
// ────────────────────────────────────────────────
export interface ParsedQuickList {
  id: string;
  sourceArtifactId: string;
  name: string;
  displayName: string;
  values: QuickListValue[];
  confidence: ConfidenceLevel;
  notes: string[];
}

export interface QuickListValue {
  code: string;
  label: string;
  parentCode?: string;
  sortOrder?: number;
}

// ────────────────────────────────────────────────
// Parsed field from a metadata or editor template
// ────────────────────────────────────────────────
export interface ParsedField {
  id: string;
  sourceArtifactId: string;
  templateId?: string;
  code: string; // FotoWare field code/tag
  label: string;
  altLabels: string[];
  fwFieldType: FWFieldType;
  quickListRef?: string; // id of associated ParsedQuickList
  required: boolean;
  readOnly: boolean;
  multiValue: boolean;
  maxLength?: number;
  exampleValues: string[];
  appearsInEditor: boolean;
  appearsInDisplay: boolean;
  sortOrder: number;
  confidence: ConfidenceLevel;
  evidence: EvidenceKind;
  notes: string[];
  rawSnippet: string;
}

// ────────────────────────────────────────────────
// Parsed template (metadata / display / text)
// ────────────────────────────────────────────────
export interface ParsedTemplate {
  id: string;
  sourceArtifactId: string;
  name: string;
  kind: "metadata" | "display" | "text" | "editor" | "unknown";
  fieldIds: string[];
  sections: ParsedEditorSection[];
  confidence: ConfidenceLevel;
  notes: string[];
}

export interface ParsedEditorSection {
  id: string;
  label: string;
  fieldIds: string[];
  collapsed: boolean;
  sortOrder: number;
}

// ────────────────────────────────────────────────
// Inference issue — something the engine flagged
// ────────────────────────────────────────────────
export interface InferenceIssue {
  id: string;
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  affectedFieldIds: string[];
  affectedArtifactIds: string[];
  suggestedAction: string;
}

// ────────────────────────────────────────────────
// ResourceSpace field proposal
// ────────────────────────────────────────────────
export interface ResourceSpaceFieldProposal {
  id: string;
  sourceFieldId: string;
  sourceLabel: string;
  sourceTypeGuess: FWFieldType;

  suggestedResourceSpaceName: string; // machine name
  suggestedResourceSpaceTitle: string; // display title
  suggestedFieldType: RSFieldType;
  suggestedOptions: string[]; // for dropdown / checkbox list

  suggestedIptcTag?: string;
  suggestedXmpTag?: string;
  suggestedExifTag?: string;

  includeInCsvExport: boolean;
  readOnlyCandidate: boolean;
  requiredCandidate: boolean;

  rationale: string;
  confidence: ConfidenceLevel;
  evidence: EvidenceKind;
  status: "proposed" | "accepted" | "rejected" | "needs_review";
  notes: string;
  warnings: string[];
}

// ────────────────────────────────────────────────
// Mapping suggestion (field-level crosswalk)
// ────────────────────────────────────────────────
export interface MappingSuggestion {
  id: string;
  sourceFieldId: string;
  proposalId: string;
  mappingType: "direct" | "transformed" | "split" | "merged" | "dropped" | "manual";
  lossWarning?: string;
  confidence: ConfidenceLevel;
  notes: string;
}

// ────────────────────────────────────────────────
// The full project/session data model
// ────────────────────────────────────────────────
export interface SourceConfigProject {
  id: string;
  createdAt: string; // ISO
  updatedAt: string;
  name: string;
  isDemo: boolean;

  artifacts: SourceArtifact[];
  fields: ParsedField[];
  templates: ParsedTemplate[];
  quickLists: ParsedQuickList[];
  issues: InferenceIssue[];
  proposals: ResourceSpaceFieldProposal[];
  mappings: MappingSuggestion[];

  stats: ProjectStats;
}

export interface ProjectStats {
  artifactCount: number;
  fieldCount: number;
  templateCount: number;
  quickListCount: number;
  issueCount: number;
  proposalCount: number;
  lowConfidenceCount: number;
  needsManualReviewCount: number;
}

// ────────────────────────────────────────────────
// Export bundle descriptor
// ────────────────────────────────────────────────
export interface ExportBundle {
  generatedAt: string;
  projectId: string;
  files: ExportFile[];
}

export interface ExportFile {
  filename: string;
  mimeType: string;
  content: string;
}

// ────────────────────────────────────────────────
// Upload session
// ────────────────────────────────────────────────
export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  content: string;
  relativePath?: string;
}

export interface ParseDiagnostic {
  filename: string;
  status: ParseStatus;
  message: string;
}

// ────────────────────────────────────────────────
// Field type inference result
// ────────────────────────────────────────────────
export interface FieldTypeInference {
  fwType: FWFieldType;
  rsType: RSFieldType;
  iptcTag?: string;
  xmpTag?: string;
  exifTag?: string;
  confidence: ConfidenceLevel;
  rationale: string;
}

// ────────────────────────────────────────────────
// Filter state for mapping studio
// ────────────────────────────────────────────────
export interface MappingFilters {
  showLowConfidenceOnly: boolean;
  showRequiredOnly: boolean;
  showUnmappedOnly: boolean;
  showListsOnly: boolean;
  showTemplatesOnly: boolean;
  searchQuery: string;
}
