import os
import json
from flask import Flask, request, jsonify, send_from_directory
from google import genai

# Resolve paths relative to this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

FRONTEND_DIST = os.path.join(SCRIPT_DIR, "frontend", "dist")

app = Flask(
    __name__,
    static_folder=FRONTEND_DIST,
    static_url_path="",
)

# --- Local agency database ---
DB_PATH = os.path.join(SCRIPT_DIR, "agencies_db.json")

def load_agencies_db():
    try:
        with open(DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

def find_in_db(name):
    db = load_agencies_db()
    key = name.lower().strip()
    if key in db:
        return db[key]
    for db_key, data in db.items():
        if key in db_key or db_key in key:
            return data
    return None


# --- Gemini AI ---
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

RESEARCH_PROMPT = """Tu es un expert en architecture et urbanisme. On te donne le nom d'une agence d'architecture ou d'un architecte.
Tu dois retourner un JSON avec les informations REELLES et VERIFIEES sur cette agence/cet architecte.

IMPORTANT :
- Ne donne QUE des informations que tu connais avec certitude (projets reels, villes reelles, specialites reelles).
- Si tu ne connais PAS l'agence ou l'architecte, retourne un JSON avec "connu": false et des champs vides.
- Pour "nom_agence_formel" : donne le nom officiel de l'agence/cabinet (ex: si on te dit "Jean Nouvel", mets "Ateliers Jean Nouvel").

Retourne UNIQUEMENT un JSON valide, sans texte avant ou apres, avec ces cles exactes :
{
  "connu": true ou false,
  "nom_agence_formel": "nom officiel de l'agence ou du cabinet",
  "nom_dirigeant": "prenom et nom du fondateur ou dirigeant principal",
  "civilite": "Madame" ou "Monsieur" ou "Madame, Monsieur",
  "ville_agence": "ville du siege principal",
  "specialite": "specialite / ADN de l'agence en 1-2 phrases courtes",
  "projet_notable": "1 a 2 projets emblematiques REELS, noms precis",
  "ce_qui_attire": "ce qui rend cette agence unique, en 1 phrase",
  "poste": "architecte collaborateur",
  "competence_cle": "2-3 competences pertinentes en lien avec la specialite de l'agence"
}"""

ANALYSIS_PROMPT = """Tu es un expert en recrutement et redaction de lettres de motivation dans le domaine de l'architecture et de l'urbanisme.

On te donne une lettre de motivation (la lettre de base du candidat). Tu dois l'analyser selon 8 criteres precis et donner une note de 0 a 10 pour chacun, avec un commentaire critique et constructif.

Evalue la lettre telle quelle, en tant que lettre de base destinee a etre personnalisee par IA pour chaque agence. La personnalisation agence sera faite automatiquement — concentre-toi sur la qualite intrinseque de la lettre.

Les 8 criteres sont :

1. PERSONNALISATION ET CIBLAGE : La lettre fait-elle reference a des elements specifiques (type d'agence, philosophie, projets) ou reste-t-elle trop generique ? Une bonne lettre de base doit avoir une structure qui permet une personnalisation facile.

2. STRUCTURE ET ORGANISATION : La lettre suit-elle une progression logique claire en 3-4 paragraphes ? (accroche, connaissance du domaine, competences, conclusion/politesse)

3. REALISATIONS CONCRETES : La lettre mentionne-t-elle des realisations specifiques, des exemples quantifiables, des projets concrets ? Ou reste-t-elle dans le vague ?

4. MOTIVATION ET ENTHOUSIASME : La lettre transmet-elle une vraie passion ? Le ton est-il authentique et personnel ?

5. ADEQUATION POSTE/PROFIL : Les competences mentionnees correspondent-elles au domaine de l'architecture ? Les mots-cles du domaine sont-ils presents ?

6. QUALITE REDACTIONNELLE : Grammaire, orthographe, richesse du vocabulaire, verbes d'action, variete des phrases. Le registre est-il soutenu sans etre pompeux ?

7. CONCISION ET IMPACT : La lettre fait-elle entre 200 et 400 mots ? Chaque phrase est-elle utile ? Y a-t-il des redondances avec le CV ?

8. PRESENTATION ET FORMAT : La structure visuelle est-elle claire ? Paragraphes bien separes ? Formule de politesse appropriee ? Objet present ?

IMPORTANT : Sois CRITIQUE et EXIGEANT. Ne mets pas des notes elevees par complaisance. Une note de 5 ou 6 est acceptable pour une lettre moyenne.
Pour chaque critere, cite des passages precis de la lettre pour illustrer ton feedback.

Retourne UNIQUEMENT un JSON valide, sans texte avant ou apres, avec cette structure exacte :
{
    "score_global": 6.5,
    "verdict": "Une phrase de verdict global sur la qualite de la lettre",
    "criteres": [
        {
            "id": "personnalisation",
            "nom": "Personnalisation et ciblage",
            "score": 8,
            "feedback": "2-3 phrases de feedback specifique avec des exemples tires de la lettre",
            "extrait_concerne": "le passage exact de la lettre qui pose probleme ou qui est bien fait"
        },
        {
            "id": "structure",
            "nom": "Structure et organisation",
            "score": 7,
            "feedback": "...",
            "extrait_concerne": "..."
        },
        {
            "id": "realisations",
            "nom": "Realisations concretes",
            "score": 5,
            "feedback": "...",
            "extrait_concerne": "..."
        },
        {
            "id": "motivation",
            "nom": "Motivation et enthousiasme",
            "score": 6,
            "feedback": "...",
            "extrait_concerne": "..."
        },
        {
            "id": "adequation",
            "nom": "Adequation poste/profil",
            "score": 7,
            "feedback": "...",
            "extrait_concerne": "..."
        },
        {
            "id": "qualite_redaction",
            "nom": "Qualite redactionnelle",
            "score": 8,
            "feedback": "...",
            "extrait_concerne": "..."
        },
        {
            "id": "concision",
            "nom": "Concision et impact",
            "score": 7,
            "feedback": "...",
            "extrait_concerne": "..."
        },
        {
            "id": "presentation",
            "nom": "Presentation et format",
            "score": 9,
            "feedback": "...",
            "extrait_concerne": "..."
        }
    ]
}"""

FIX_PROMPT = """Tu es un expert en redaction de lettres de motivation pour l'architecture.

On te donne :
1. Une lettre de motivation complete (la lettre de base du candidat)
2. Un critere specifique a ameliorer, avec le feedback et l'extrait concerne

ETAPE 1 — EVALUATION : Analyse d'abord si tu as assez d'informations pour corriger efficacement ce passage.
Si tu as BESOIN d'informations complementaires du candidat pour proposer une correction pertinente et concrete (par exemple : des projets specifiques qu'il a realises, des competences precises, des experiences particulieres), alors pose UNE question claire et precise.

Si tu as assez d'informations, passe directement a la correction.

REGLES DE CORRECTION :
- Ne modifie que le minimum necessaire pour ameliorer ce critere specifique
- Garde le meme ton, style et registre que le reste de la lettre
- Sois concret et specifique dans tes ameliorations
- Le texte ameliore doit s'integrer naturellement dans la lettre
- Pour "original", copie le passage EXACTEMENT tel qu'il apparait dans la lettre (caractere pour caractere)

Retourne UNIQUEMENT un JSON valide avec UNE de ces deux structures :

Si tu as besoin d'informations :
{
    "type": "question",
    "question": "Ta question precise au candidat"
}

Si tu peux corriger directement :
{
    "type": "correction",
    "original": "le passage original exact tel qu'il apparait dans la lettre",
    "corrected": "le passage corrige et ameliore",
    "explanation": "1 phrase expliquant ce qui a ete ameliore et pourquoi"
}"""

FIX_WITH_ANSWER_PROMPT = """Tu es un expert en redaction de lettres de motivation pour l'architecture.

On te donne :
1. Une lettre de motivation complete
2. Un critere specifique a ameliorer, avec le feedback et l'extrait concerne
3. Une question que tu avais posee au candidat
4. La reponse du candidat

Ta mission : reecris UNIQUEMENT la partie de la lettre qui doit etre amelioree, en utilisant les informations fournies par le candidat.

REGLES :
- Ne modifie que le minimum necessaire pour ameliorer ce critere specifique
- Integre naturellement les informations du candidat dans le texte
- Garde le meme ton, style et registre que le reste de la lettre
- Pour "original", copie le passage EXACTEMENT tel qu'il apparait dans la lettre

Retourne UNIQUEMENT un JSON valide :
{
    "type": "correction",
    "original": "le passage original exact",
    "corrected": "le passage corrige avec les infos du candidat",
    "explanation": "1 phrase expliquant ce qui a ete ameliore"
}"""

LETTER_PROMPT = """Tu es un redacteur expert en lettres de motivation pour le domaine de l'architecture.

On te fournit :
1. Une LETTRE DE BASE ecrite par le candidat (sa lettre de motivation originale, complete)
2. Des INFORMATIONS sur l'agence ciblee
3. Eventuellement des CONSIGNES SUPPLEMENTAIRES du candidat

Ta mission : personnaliser la lettre de base pour cette agence specifique.

REGLES DE PERSONNALISATION :
- Garde le TON, le STYLE et la PERSONNALITE du candidat tels qu'ils sont dans la lettre de base
- Respecte la STRUCTURE generale (nombre de paragraphes, type de formule de politesse)
- Utilise le meme registre de langue que la lettre de base
- Garde les crochets [Votre Prenom Nom], [Telephone], [Email] tels quels si presents
- Si des consignes supplementaires sont fournies, respecte-les en priorite

EXIGENCES DE PERSONNALISATION PROFONDE :
1. ACCROCHE : Remplace toute accroche generique par une ouverture qui mentionne un element precis de l'agence (projet, philosophie, actualite)
2. PROJETS : Cite au moins 1 projet notable de l'agence, et explique en 1-2 phrases POURQUOI ce projet resonne avec le parcours ou les aspirations du candidat. Ne te contente pas de nommer le projet.
3. SPECIALITE : Fais un lien explicite entre la specialite/ADN de l'agence et une competence ou experience du candidat mentionnee dans sa lettre de base
4. DIRIGEANT : Si le nom du dirigeant est connu, integre-le naturellement (ex: dans la formule de politesse ou une reference a sa vision)
5. PHILOSOPHIE : Montre que le candidat partage les valeurs ou la vision de l'agence en reformulant avec ses propres mots
6. COMPETENCES : Adapte la mise en avant des competences du candidat pour qu'elles fassent echo aux competences cles recherchees par l'agence

ANTI-PATTERNS A EVITER :
- Ne fais PAS de copie-colle des informations brutes
- Ne fais pas de liste de projets sans analyse personnelle
- Evite les formulations bateau comme "votre agence reconnue pour son expertise..."
- Ne repete pas mot pour mot les informations de l'agence : reformule avec elegance et authenticite
- Ne rajoute pas d'informations inventees sur le candidat

IMPORTANT : Retourne UNIQUEMENT le texte de la lettre personnalisee, sans commentaire ni explication. Pas de markdown, juste le texte brut."""


HIGHLIGHT_PROMPT = """Tu es un annotateur de texte expert.

On te donne :
1. Une lettre de motivation personnalisee pour une agence d'architecture
2. Les informations de l'agence qui ont servi a la personnalisation

Ta mission : decomposer la lettre ENTIERE en segments contigus, en annotant chaque segment avec une categorie s'il fait reference a un element specifique de l'agence.

CATEGORIES :
- "specialite" : reference a la specialite, l'ADN ou l'approche architecturale de l'agence
- "projet_notable" : reference a un projet specifique de l'agence
- "dirigeant" : reference au nom du dirigeant ou fondateur
- "competence_cle" : reference a une competence cle en lien avec l'agence
- "philosophie" : reference a ce qui attire chez l'agence, sa philosophie, ses valeurs
- null : texte generique, non specifique a l'agence

REGLES STRICTES :
- La CONCATENATION de tous les segments doit reproduire la lettre EXACTEMENT, caractere pour caractere (espaces, sauts de ligne, ponctuation inclus)
- Chaque segment doit etre le plus court possible : ne mets dans un segment annote QUE les mots qui referencent directement l'element de l'agence
- Les espaces et la ponctuation autour d'un element annote doivent etre dans des segments null separes
- Ne fusionne JAMAIS deux categories differentes dans un seul segment

Retourne UNIQUEMENT un JSON valide, sans texte avant ou apres :
{
  "segments": [
    { "text": "...", "category": null },
    { "text": "...", "category": "specialite" },
    ...
  ]
}"""


def query_gemini(prompt, use_search=False):
    client = genai.Client(api_key=GEMINI_API_KEY)
    config = None
    if use_search:
        config = genai.types.GenerateContentConfig(
            tools=[genai.types.Tool(google_search=genai.types.GoogleSearch())],
        )
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=config,
    )
    return response.text


# --- Routes ---
@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIST, "index.html")


@app.route("/api/agencies/search", methods=["GET"])
def search_agencies():
    q = request.args.get("q", "").lower().strip()
    if len(q) < 1:
        return jsonify([])

    db = load_agencies_db()
    results = []
    seen_directors = set()

    for key, data in db.items():
        # Search across all relevant fields
        searchable = " ".join([
            key,
            data.get("nom_display", "").lower(),
            data.get("nom_dirigeant", "").lower(),
            data.get("ville_agence", "").lower(),
            data.get("specialite", "").lower(),
        ])

        # Check if ALL words in query match somewhere
        query_words = q.split()
        if all(word in searchable for word in query_words):
            dedup_key = data.get("nom_dirigeant", key)
            if dedup_key not in seen_directors:
                seen_directors.add(dedup_key)
                # Score: exact key prefix > key contains > other field match
                if key.startswith(q):
                    score = 0
                elif q in key:
                    score = 1
                else:
                    score = 2
                results.append({
                    "key": key,
                    "name": data.get("nom_display", key.title()),
                    "ville": data.get("ville_agence", ""),
                    "specialite_short": data.get("specialite", "")[:120],
                    "nom_dirigeant": data.get("nom_dirigeant", ""),
                    "projet_notable": data.get("projet_notable", ""),
                    "ce_qui_attire": data.get("ce_qui_attire", ""),
                    "competence_cle": data.get("competence_cle", ""),
                    "_score": score,
                })

    results.sort(key=lambda r: (r["_score"], r["key"]))
    # Remove internal score before returning
    for r in results:
        del r["_score"]
    return jsonify(results[:10])


def _resolve_agency(nom_agence):
    """Resolve agency info from local DB or Gemini. Returns (fields, error_response)."""
    local_result = find_in_db(nom_agence)
    if local_result:
        fields = {**local_result, "source": "local"}
    else:
        try:
            response_text = query_gemini(
                f"{RESEARCH_PROMPT}\n\nAgence : {nom_agence}",
                use_search=True,
            )
            start = response_text.find("{")
            end = response_text.rfind("}") + 1
            if start == -1 or end == 0:
                return None, (jsonify({"error": "Reponse invalide de l'IA"}), 500)

            fields = json.loads(response_text[start:end])

            if not fields.get("connu", True):
                return None, (jsonify({"error": f"Agence \"{nom_agence}\" non reconnue par l'IA. Verifiez l'orthographe."}), 404)

            fields["source"] = "gemini"
        except json.JSONDecodeError:
            return None, (jsonify({"error": "Impossible de parser la reponse IA"}), 500)
        except Exception as e:
            err = str(e)
            if "429" in err or "RESOURCE_EXHAUSTED" in err:
                return None, (jsonify({"error": "Quota API epuise. Reessayez dans quelques minutes."}), 429)
            return None, (jsonify({"error": f"Erreur: {err}"}), 500)

    # Ensure all required keys exist
    required = [
        "nom_dirigeant", "civilite", "ville_agence", "specialite",
        "projet_notable", "ce_qui_attire", "poste", "competence_cle",
    ]
    for key in required:
        if key not in fields:
            fields[key] = ""

    return fields, None


@app.route("/api/research-agency", methods=["POST"])
def research_agency():
    data = request.get_json()
    nom_agence = data.get("nom_agence", "").strip()

    if not nom_agence or len(nom_agence) < 2:
        return jsonify({"error": "Nom d'agence requis"}), 400

    fields, error = _resolve_agency(nom_agence)
    if error:
        return error

    formal_name = fields.get("nom_agence_formel", fields.get("nom_display", nom_agence))

    return jsonify({
        "key": nom_agence.lower(),
        "name": formal_name,
        "ville_agence": fields["ville_agence"],
        "specialite": fields["specialite"],
        "projet_notable": fields["projet_notable"],
        "nom_dirigeant": fields["nom_dirigeant"],
        "ce_qui_attire": fields.get("ce_qui_attire", ""),
        "competence_cle": fields.get("competence_cle", ""),
        "source": fields.get("source", "unknown"),
    })


@app.route("/api/generate", methods=["POST"])
def generate():
    data = request.get_json()
    nom_agence = data.get("nom_agence", "").strip()
    base_letter = data.get("base_letter", "").strip()
    instructions = data.get("instructions", "").strip()

    if not nom_agence:
        return jsonify({"error": "Nom d'agence requis"}), 400
    if not base_letter or len(base_letter) < 50:
        return jsonify({"error": "Lettre de base trop courte (min. 50 caracteres)"}), 400

    # 1. Get agency info
    fields, error = _resolve_agency(nom_agence)
    if error:
        return error

    # 2. Generate personalized letter from base letter + agency info
    try:
        formal_name = fields.get("nom_agence_formel", fields.get("nom_display", nom_agence))
        info_summary = (
            f"Agence : {formal_name}\n"
            f"Dirigeant : {fields['nom_dirigeant']}\n"
            f"Ville : {fields['ville_agence']}\n"
            f"Specialite : {fields['specialite']}\n"
            f"Projets notables : {fields['projet_notable']}\n"
            f"Ce qui attire : {fields['ce_qui_attire']}\n"
            f"Poste vise : {fields['poste']}\n"
            f"Competences cles : {fields['competence_cle']}\n"
        )

        prompt_parts = [
            LETTER_PROMPT,
            f"\n\n--- LETTRE DE BASE ---\n{base_letter}",
            f"\n\n--- INFORMATIONS AGENCE ---\n{info_summary}",
        ]
        if instructions:
            prompt_parts.append(f"\n\n--- CONSIGNES SUPPLEMENTAIRES ---\n{instructions}")

        letter_text = query_gemini("".join(prompt_parts), use_search=False).strip()

        # 3. Annotate letter with highlights (non-fatal if it fails)
        highlights = []
        try:
            highlight_prompt = (
                f"{HIGHLIGHT_PROMPT}\n\n"
                f"--- LETTRE PERSONNALISEE ---\n{letter_text}\n\n"
                f"--- INFORMATIONS AGENCE ---\n{info_summary}"
            )
            highlight_response = query_gemini(highlight_prompt, use_search=False)
            cleaned_hl = highlight_response.strip()
            if cleaned_hl.startswith("```"):
                first_nl = cleaned_hl.find("\n")
                if first_nl != -1:
                    cleaned_hl = cleaned_hl[first_nl + 1:]
                if cleaned_hl.rstrip().endswith("```"):
                    cleaned_hl = cleaned_hl.rstrip()[:-3].rstrip()
            hl_start = cleaned_hl.find("{")
            hl_end = cleaned_hl.rfind("}") + 1
            if hl_start != -1 and hl_end > 0:
                parsed_hl = json.loads(cleaned_hl[hl_start:hl_end])
                segments = parsed_hl.get("segments", [])
                # Validate: concatenation must equal letter text exactly
                reconstructed = "".join(s["text"] for s in segments)
                if reconstructed == letter_text:
                    highlights = segments
        except Exception:
            pass  # Highlight failure is non-fatal

        agency_info = {
            "key": nom_agence.lower(),
            "name": formal_name,
            "ville_agence": fields["ville_agence"],
            "specialite": fields["specialite"],
            "projet_notable": fields["projet_notable"],
            "nom_dirigeant": fields["nom_dirigeant"],
            "ce_qui_attire": fields.get("ce_qui_attire", ""),
            "competence_cle": fields.get("competence_cle", ""),
        }

        return jsonify({
            "personalized_letter": letter_text,
            "agency_info": agency_info,
            "highlights": highlights,
        })
    except Exception as e:
        err = str(e)
        if "429" in err or "RESOURCE_EXHAUSTED" in err:
            return jsonify({"error": "Quota API epuise. Reessayez dans quelques minutes."}), 429
        return jsonify({"error": f"Erreur: {err}"}), 500


@app.route("/api/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    letter_text = data.get("letter", data.get("base_letter", data.get("template", ""))).strip()

    if not letter_text:
        return jsonify({"error": "Lettre requise pour l'analyse"}), 400

    if len(letter_text) < 50:
        return jsonify({"error": "La lettre est trop courte pour une analyse pertinente"}), 400

    try:
        response_text = query_gemini(
            f"{ANALYSIS_PROMPT}\n\n--- LETTRE A ANALYSER ---\n{letter_text}",
            use_search=False,
        )
        # Strip markdown code fences if present
        cleaned = response_text.strip()
        if cleaned.startswith("```"):
            # Remove opening fence (```json or ```)
            first_newline = cleaned.find("\n")
            if first_newline != -1:
                cleaned = cleaned[first_newline + 1:]
            # Remove closing fence
            if cleaned.rstrip().endswith("```"):
                cleaned = cleaned.rstrip()[:-3].rstrip()

        start = cleaned.find("{")
        end = cleaned.rfind("}") + 1
        if start == -1 or end == 0:
            return jsonify({"error": "Reponse invalide de l'IA"}), 500

        result = json.loads(cleaned[start:end])
        return jsonify(result)

    except json.JSONDecodeError:
        return jsonify({"error": "Impossible de parser la reponse IA"}), 500
    except Exception as e:
        err = str(e)
        if "429" in err or "RESOURCE_EXHAUSTED" in err:
            return jsonify({"error": "Quota API epuise. Reessayez dans quelques minutes."}), 429
        return jsonify({"error": f"Erreur: {err}"}), 500


@app.route("/api/highlight", methods=["POST"])
def highlight():
    data = request.get_json()
    letter_text = data.get("letter", "").strip()
    agency_info = data.get("agency_info", {})

    if not letter_text or len(letter_text) < 50:
        return jsonify({"error": "Lettre trop courte"}), 400

    info_summary = (
        f"Agence : {agency_info.get('name', '')}\n"
        f"Dirigeant : {agency_info.get('nom_dirigeant', '')}\n"
        f"Ville : {agency_info.get('ville_agence', '')}\n"
        f"Specialite : {agency_info.get('specialite', '')}\n"
        f"Projets notables : {agency_info.get('projet_notable', '')}\n"
        f"Ce qui attire : {agency_info.get('ce_qui_attire', '')}\n"
        f"Competences cles : {agency_info.get('competence_cle', '')}\n"
    )

    try:
        highlight_prompt = (
            f"{HIGHLIGHT_PROMPT}\n\n"
            f"--- LETTRE PERSONNALISEE ---\n{letter_text}\n\n"
            f"--- INFORMATIONS AGENCE ---\n{info_summary}"
        )
        response_text = query_gemini(highlight_prompt, use_search=False)
        cleaned = response_text.strip()
        if cleaned.startswith("```"):
            first_newline = cleaned.find("\n")
            if first_newline != -1:
                cleaned = cleaned[first_newline + 1:]
            if cleaned.rstrip().endswith("```"):
                cleaned = cleaned.rstrip()[:-3].rstrip()
        start = cleaned.find("{")
        end = cleaned.rfind("}") + 1
        if start == -1 or end == 0:
            return jsonify({"error": "Reponse invalide"}), 500

        parsed = json.loads(cleaned[start:end])
        segments = parsed.get("segments", [])
        reconstructed = "".join(s["text"] for s in segments)
        if reconstructed != letter_text:
            return jsonify({"error": "Annotation invalide (texte reconstruit different)"}), 500

        return jsonify({"highlights": segments})
    except json.JSONDecodeError:
        return jsonify({"error": "Impossible de parser la reponse IA"}), 500
    except Exception as e:
        err = str(e)
        if "429" in err or "RESOURCE_EXHAUSTED" in err:
            return jsonify({"error": "Quota API epuise."}), 429
        return jsonify({"error": f"Erreur: {err}"}), 500


@app.route("/api/fix-criterion", methods=["POST"])
def fix_criterion():
    data = request.get_json()
    base_letter = data.get("base_letter", data.get("template", "")).strip()
    criterion_id = data.get("criterion_id", "")
    criterion_name = data.get("criterion_name", "")
    feedback = data.get("feedback", "")
    extrait = data.get("extrait_concerne", "")
    user_answer = data.get("user_answer", "").strip()
    previous_question = data.get("previous_question", "").strip()

    if not base_letter or not criterion_id:
        return jsonify({"error": "Lettre et critere requis"}), 400

    try:
        if user_answer and previous_question:
            prompt = (
                f"{FIX_WITH_ANSWER_PROMPT}\n\n"
                f"--- LETTRE COMPLETE ---\n{base_letter}\n\n"
                f"--- CRITERE A AMELIORER ---\n"
                f"Critere : {criterion_name}\n"
                f"Feedback : {feedback}\n"
                f"Extrait concerne : {extrait}\n\n"
                f"--- QUESTION POSEE ---\n{previous_question}\n\n"
                f"--- REPONSE DU CANDIDAT ---\n{user_answer}\n"
            )
        else:
            prompt = (
                f"{FIX_PROMPT}\n\n"
                f"--- LETTRE COMPLETE ---\n{base_letter}\n\n"
                f"--- CRITERE A AMELIORER ---\n"
                f"Critere : {criterion_name}\n"
                f"Feedback : {feedback}\n"
                f"Extrait concerne : {extrait}\n"
            )

        response_text = query_gemini(prompt, use_search=False)

        # Strip markdown code fences if present
        cleaned = response_text.strip()
        if cleaned.startswith("```"):
            first_newline = cleaned.find("\n")
            if first_newline != -1:
                cleaned = cleaned[first_newline + 1:]
            if cleaned.rstrip().endswith("```"):
                cleaned = cleaned.rstrip()[:-3].rstrip()

        start = cleaned.find("{")
        end = cleaned.rfind("}") + 1
        if start == -1 or end == 0:
            return jsonify({"error": "Reponse invalide de l'IA"}), 500

        result = json.loads(cleaned[start:end])
        return jsonify(result)

    except json.JSONDecodeError:
        return jsonify({"error": "Impossible de parser la reponse IA"}), 500
    except Exception as e:
        err = str(e)
        if "429" in err or "RESOURCE_EXHAUSTED" in err:
            return jsonify({"error": "Quota API epuise. Reessayez dans quelques minutes."}), 429
        return jsonify({"error": f"Erreur: {err}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8090))
    app.run(host="0.0.0.0", port=port, debug=False)
