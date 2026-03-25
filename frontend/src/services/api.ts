import { supabase } from '../lib/supabase';
import type { GenerateResponse, AnalysisResult, FixResponse, AgencySearchResult, AgencyInfo, HighlightSegment } from '../types';

// --- Helper for Flask backend calls (generate, analyze, fix still use Gemini via backend) ---
async function request<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Erreur ${res.status}`);
  }
  return data as T;
}

// --- Agencies: now from Supabase ---
export async function searchAgencies(query: string): Promise<AgencySearchResult[]> {
  if (query.length < 1) return [];

  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/);

  // Use ilike for fuzzy matching on key and nom_display
  const { data, error } = await supabase
    .from('agencies')
    .select('key, nom_display, ville_agence, specialite, nom_dirigeant, projet_notable, ce_qui_attire, competence_cle')
    .or(`key.ilike.%${q}%,nom_display.ilike.%${q}%,nom_dirigeant.ilike.%${q}%,ville_agence.ilike.%${q}%`)
    .limit(10);

  if (error || !data) return [];

  // Client-side filter: all words must match somewhere
  const filtered = data.filter((row) => {
    const searchable = [row.key, row.nom_display, row.nom_dirigeant, row.ville_agence, row.specialite]
      .join(' ')
      .toLowerCase();
    return words.every((w) => searchable.includes(w));
  });

  // Deduplicate by nom_dirigeant
  const seen = new Set<string>();
  const results: AgencySearchResult[] = [];
  for (const row of filtered) {
    const dedup = row.nom_dirigeant || row.key;
    if (seen.has(dedup)) continue;
    seen.add(dedup);
    results.push({
      key: row.key,
      name: row.nom_display,
      ville: row.ville_agence,
      specialite_short: (row.specialite || '').slice(0, 120),
      nom_dirigeant: row.nom_dirigeant,
      projet_notable: row.projet_notable,
      ce_qui_attire: row.ce_qui_attire,
      competence_cle: row.competence_cle,
    });
  }
  return results;
}

export function researchAgency(nomAgence: string) {
  return request<AgencyInfo & { source: string }>('/api/research-agency', { nom_agence: nomAgence });
}

export function generate(nomAgence: string, baseLetter: string, instructions?: string) {
  return request<GenerateResponse>('/api/generate', {
    nom_agence: nomAgence,
    base_letter: baseLetter,
    instructions: instructions || '',
  });
}

export function analyze(letterText: string) {
  return request<AnalysisResult>('/api/analyze', { letter: letterText });
}

export function highlight(letter: string, agencyInfo: AgencyInfo) {
  return request<{ highlights: HighlightSegment[] }>('/api/highlight', {
    letter,
    agency_info: agencyInfo,
  });
}

export function fixCriterion(
  baseLetter: string,
  criterionId: string,
  criterionName: string,
  feedback: string,
  extraitConcerne: string,
  userAnswer?: string,
  previousQuestion?: string,
) {
  return request<FixResponse>('/api/fix-criterion', {
    base_letter: baseLetter,
    criterion_id: criterionId,
    criterion_name: criterionName,
    feedback,
    extrait_concerne: extraitConcerne,
    user_answer: userAnswer || '',
    previous_question: previousQuestion || '',
  });
}

// --- Saved letters: Supabase ---
export async function getSavedLetters() {
  const { data, error } = await supabase
    .from('saved_letters')
    .select('id, name, content, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function saveLetter(name: string, content: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non connecte');

  const { error } = await supabase
    .from('saved_letters')
    .insert({ user_id: user.id, name, content });

  if (error) throw new Error(error.message);
}

export async function deleteSavedLetter(id: string) {
  const { error } = await supabase
    .from('saved_letters')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}
