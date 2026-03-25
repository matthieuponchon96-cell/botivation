import { createContext, useReducer, useContext, type ReactNode, type Dispatch } from 'react';
import type { AgencyInfo, AnalysisResult, Correction, AiQuestion, HighlightSegment, TabId } from '../types';
import { DEFAULT_BASE_LETTER } from '../constants';
import { escapeHtml } from '../utils/escapeHtml';

// State
export interface AppState {
  baseLetter: string;
  selectedAgency: AgencyInfo | null;
  userInstructions: string;
  personalizedLetter: string;
  personalizedLetterHtml: string;
  highlightSegments: HighlightSegment[];
  analysisResult: AnalysisResult | null;
  analysisTarget: 'base' | 'personalized';
  pendingCorrections: Record<number, Correction>;
  pendingQuestions: Record<number, AiQuestion>;
  activeTab: TabId;
  isResearching: boolean;
  isGenerating: boolean;
  isAnalyzing: boolean;
  isEditingLetter: boolean;
  editDraftLetter: string;
  regenerateInstructions: string;
  fixingCriterionIndex: number | null;
  correctionsApplied: boolean;
}

const initialState: AppState = {
  baseLetter: DEFAULT_BASE_LETTER,
  selectedAgency: null,
  userInstructions: '',
  personalizedLetter: '',
  personalizedLetterHtml: '',
  highlightSegments: [],
  analysisResult: null,
  analysisTarget: 'base',
  pendingCorrections: {},
  pendingQuestions: {},
  activeTab: 'preview',
  isResearching: false,
  isGenerating: false,
  isAnalyzing: false,
  isEditingLetter: false,
  editDraftLetter: '',
  regenerateInstructions: '',
  fixingCriterionIndex: null,
  correctionsApplied: false,
};

// Actions
type Action =
  | { type: 'SET_BASE_LETTER'; text: string }
  | { type: 'SET_SELECTED_AGENCY'; agency: AgencyInfo | null }
  | { type: 'SET_USER_INSTRUCTIONS'; text: string }
  | { type: 'SET_PERSONALIZED_LETTER'; letter: string; html: string; segments?: HighlightSegment[] }
  | { type: 'CLEAR_PERSONALIZED_LETTER' }
  | { type: 'SET_HIGHLIGHT_SEGMENTS'; segments: HighlightSegment[] }
  | { type: 'SET_EDITING_LETTER'; value: boolean }
  | { type: 'SET_EDIT_DRAFT'; text: string }
  | { type: 'SAVE_EDITED_LETTER' }
  | { type: 'SET_REGENERATE_INSTRUCTIONS'; text: string }
  | { type: 'SET_ANALYSIS_TARGET'; target: 'base' | 'personalized' }
  | { type: 'SET_ACTIVE_TAB'; tab: TabId }
  | { type: 'SET_ANALYSIS'; result: AnalysisResult | null }
  | { type: 'SET_CORRECTION'; index: number; correction: Correction }
  | { type: 'SET_QUESTION'; index: number; question: AiQuestion }
  | { type: 'ANSWER_QUESTION'; index: number; answer: string }
  | { type: 'CLEAR_QUESTION'; index: number }
  | { type: 'APPLY_CORRECTION'; index: number }
  | { type: 'DISMISS_CORRECTION'; index: number }
  | { type: 'SET_RESEARCHING'; value: boolean }
  | { type: 'SET_GENERATING'; value: boolean }
  | { type: 'SET_ANALYZING'; value: boolean }
  | { type: 'SET_FIXING_INDEX'; index: number | null }
  | { type: 'RESET_ALL' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_BASE_LETTER':
      return { ...state, baseLetter: action.text };
    case 'SET_SELECTED_AGENCY':
      return { ...state, selectedAgency: action.agency };
    case 'SET_USER_INSTRUCTIONS':
      return { ...state, userInstructions: action.text };
    case 'SET_PERSONALIZED_LETTER':
      return {
        ...state,
        personalizedLetter: action.letter,
        personalizedLetterHtml: action.html,
        highlightSegments: action.segments || [],
        isEditingLetter: false,
        editDraftLetter: '',
      };
    case 'CLEAR_PERSONALIZED_LETTER':
      return {
        ...state,
        personalizedLetter: '',
        personalizedLetterHtml: '',
        highlightSegments: [],
        isEditingLetter: false,
        editDraftLetter: '',
        regenerateInstructions: '',
      };
    case 'SET_HIGHLIGHT_SEGMENTS':
      return { ...state, highlightSegments: action.segments };
    case 'SET_EDITING_LETTER':
      return action.value
        ? { ...state, isEditingLetter: true, editDraftLetter: state.personalizedLetter }
        : { ...state, isEditingLetter: false, editDraftLetter: '' };
    case 'SET_EDIT_DRAFT':
      return { ...state, editDraftLetter: action.text };
    case 'SAVE_EDITED_LETTER':
      return {
        ...state,
        personalizedLetter: state.editDraftLetter,
        personalizedLetterHtml: escapeHtml(state.editDraftLetter),
        isEditingLetter: false,
        editDraftLetter: '',
        highlightSegments: [], // highlights become stale after manual edit
      };
    case 'SET_REGENERATE_INSTRUCTIONS':
      return { ...state, regenerateInstructions: action.text };
    case 'SET_ANALYSIS_TARGET':
      return { ...state, analysisTarget: action.target };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.tab };
    case 'SET_ANALYSIS':
      return { ...state, analysisResult: action.result, pendingCorrections: {}, pendingQuestions: {}, correctionsApplied: false };
    case 'SET_CORRECTION':
      return { ...state, pendingCorrections: { ...state.pendingCorrections, [action.index]: action.correction } };
    case 'SET_QUESTION':
      return { ...state, pendingQuestions: { ...state.pendingQuestions, [action.index]: action.question } };
    case 'ANSWER_QUESTION': {
      const q = state.pendingQuestions[action.index];
      if (!q) return state;
      return { ...state, pendingQuestions: { ...state.pendingQuestions, [action.index]: { ...q, answer: action.answer } } };
    }
    case 'CLEAR_QUESTION': {
      const { [action.index]: _, ...rest } = state.pendingQuestions;
      return { ...state, pendingQuestions: rest };
    }
    case 'APPLY_CORRECTION': {
      const correction = state.pendingCorrections[action.index];
      if (!correction) return state;
      const newBaseLetter = state.baseLetter.replace(correction.original, correction.corrected);
      const { [action.index]: _, ...rest } = state.pendingCorrections;
      return { ...state, baseLetter: newBaseLetter, pendingCorrections: rest, correctionsApplied: true };
    }
    case 'DISMISS_CORRECTION': {
      const { [action.index]: _c, ...restC } = state.pendingCorrections;
      const { [action.index]: _q, ...restQ } = state.pendingQuestions;
      return { ...state, pendingCorrections: restC, pendingQuestions: restQ };
    }
    case 'SET_RESEARCHING':
      return { ...state, isResearching: action.value };
    case 'SET_GENERATING':
      return { ...state, isGenerating: action.value };
    case 'SET_ANALYZING':
      return { ...state, isAnalyzing: action.value };
    case 'SET_FIXING_INDEX':
      return { ...state, fixingCriterionIndex: action.index };
    case 'RESET_ALL':
      return { ...initialState };
    default:
      return state;
  }
}

// Context
const AppStateContext = createContext<AppState>(initialState);
const AppDispatchContext = createContext<Dispatch<Action>>(() => {});

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  return useContext(AppStateContext);
}

export function useAppDispatch() {
  return useContext(AppDispatchContext);
}
