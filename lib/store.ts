"use client";

import { create } from "zustand";
import type {
  SourceConfigProject,
  ResourceSpaceFieldProposal,
  MappingFilters,
  ParseDiagnostic,
} from "@/types";
import { isoNow } from "@/lib/utils";

type AppStep = "upload" | "analyzing" | "source" | "mapping" | "preview" | "export";

interface AppState {
  // Session
  project: SourceConfigProject | null;
  currentStep: AppStep;
  diagnostics: ParseDiagnostic[];
  isAnalyzing: boolean;

  // Filters
  mappingFilters: MappingFilters;

  // Actions
  setProject: (project: SourceConfigProject) => void;
  clearProject: () => void;
  setCurrentStep: (step: AppStep) => void;
  setDiagnostics: (diagnostics: ParseDiagnostic[]) => void;
  setIsAnalyzing: (value: boolean) => void;

  // Proposal mutations
  updateProposal: (id: string, patch: Partial<ResourceSpaceFieldProposal>) => void;
  acceptProposal: (id: string) => void;
  rejectProposal: (id: string) => void;
  resetProposalStatus: (id: string) => void;

  // Filter mutations
  setMappingFilter: (patch: Partial<MappingFilters>) => void;
  resetMappingFilters: () => void;
}

const DEFAULT_FILTERS: MappingFilters = {
  showLowConfidenceOnly: false,
  showRequiredOnly: false,
  showUnmappedOnly: false,
  showListsOnly: false,
  showTemplatesOnly: false,
  searchQuery: "",
};

export const useAppStore = create<AppState>((set) => ({
  project: null,
  currentStep: "upload",
  diagnostics: [],
  isAnalyzing: false,
  mappingFilters: { ...DEFAULT_FILTERS },

  setProject: (project) => set({ project }),
  clearProject: () => set({ project: null, currentStep: "upload", diagnostics: [] }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setDiagnostics: (diagnostics) => set({ diagnostics }),
  setIsAnalyzing: (value) => set({ isAnalyzing: value }),

  updateProposal: (id, patch) =>
    set((state) => {
      if (!state.project) return state;
      return {
        project: {
          ...state.project,
          updatedAt: isoNow(),
          proposals: state.project.proposals.map((p) =>
            p.id === id ? { ...p, ...patch } : p
          ),
        },
      };
    }),

  acceptProposal: (id) =>
    set((state) => {
      if (!state.project) return state;
      return {
        project: {
          ...state.project,
          updatedAt: isoNow(),
          proposals: state.project.proposals.map((p) =>
            p.id === id ? { ...p, status: "accepted" } : p
          ),
        },
      };
    }),

  rejectProposal: (id) =>
    set((state) => {
      if (!state.project) return state;
      return {
        project: {
          ...state.project,
          updatedAt: isoNow(),
          proposals: state.project.proposals.map((p) =>
            p.id === id ? { ...p, status: "rejected" } : p
          ),
        },
      };
    }),

  resetProposalStatus: (id) =>
    set((state) => {
      if (!state.project) return state;
      return {
        project: {
          ...state.project,
          updatedAt: isoNow(),
          proposals: state.project.proposals.map((p) =>
            p.id === id ? { ...p, status: "proposed" } : p
          ),
        },
      };
    }),

  setMappingFilter: (patch) =>
    set((state) => ({ mappingFilters: { ...state.mappingFilters, ...patch } })),

  resetMappingFilters: () => set({ mappingFilters: { ...DEFAULT_FILTERS } }),
}));
