// Agency search result from /api/agencies/search
export interface AgencySearchResult {
  key: string;
  name: string;
  ville: string;
  specialite_short: string;
  nom_dirigeant: string;
  projet_notable: string;
  ce_qui_attire: string;
  competence_cle: string;
}

// Full agency info returned by /api/generate or selected from search
export interface AgencyInfo {
  key: string;
  name: string;
  ville_agence: string;
  specialite: string;
  projet_notable: string;
  nom_dirigeant: string;
  ce_qui_attire?: string;
  competence_cle?: string;
}

// Highlight segment for annotated letter display
export type HighlightCategory =
  | 'specialite'
  | 'projet_notable'
  | 'dirigeant'
  | 'competence_cle'
  | 'philosophie'
  | null;

export interface HighlightSegment {
  text: string;
  category: HighlightCategory;
}

// Response from /api/generate
export interface GenerateResponse {
  personalized_letter: string;
  agency_info: AgencyInfo;
  highlights: HighlightSegment[];
}

// AI question during fix
export interface AiQuestion {
  criterionIndex: number;
  question: string;
  answer?: string;
}

// Fix response: either a question or a correction
export interface FixResponse {
  type: 'question' | 'correction';
  question?: string;
  original?: string;
  corrected?: string;
  explanation?: string;
}

export interface Criterion {
  id: string;
  nom: string;
  score: number;
  feedback: string;
  extrait_concerne: string;
}

export interface AnalysisResult {
  score_global: number;
  verdict: string;
  criteres: Criterion[];
}

export interface Correction {
  original: string;
  corrected: string;
  explanation: string;
}

export interface SavedTemplate {
  name: string;
  content: string;
}

export type TabId = 'preview' | 'analysis';
