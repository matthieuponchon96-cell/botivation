// --- State ---
const FIELDS = [
    'nom_agence', 'nom_dirigeant', 'civilite', 'ville_agence',
    'specialite', 'projet_notable', 'ce_qui_attire', 'poste', 'competence_cle'
];

const STORAGE_KEYS = {
    templates: 'lm_templates',
    agencies: 'lm_agencies',
};

// --- DOM ---
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const els = {
    preview: $('#letter-preview'),
    templateEditor: $('#template-editor'),
    outputActions: $('#output-actions'),
    previewLegend: $('#preview-legend'),
    btnGenerate: $('#btn-generate'),
    btnReset: $('#btn-reset'),
    btnCopy: $('#btn-copy'),
    btnDownload: $('#btn-download'),
    btnSaveTemplate: $('#btn-save-template'),
    btnSaveAgency: $('#btn-save-agency'),
    savedTemplatesList: $('#saved-templates-list'),
    savedAgenciesList: $('#saved-agencies-list'),
    toast: $('#toast'),
    // Auto-generate
    autoAgencyName: $('#auto-agency-name'),
    btnAutoGenerate: $('#btn-auto-generate'),
    btnAutoText: $('.btn-auto-text'),
    btnAutoSpinner: $('.btn-auto-spinner'),
    // Analysis
    btnAnalyze: $('#btn-analyze-template'),
    btnAnalyzeText: $('.btn-analyze-text'),
    btnAnalyzeSpinner: $('.btn-analyze-spinner'),
    analysisDashboard: $('#analysis-dashboard'),
};

// --- Tabs ---
$$('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
        $$('.tab').forEach((t) => t.classList.remove('active'));
        $$('.tab-content').forEach((c) => c.classList.remove('active'));
        tab.classList.add('active');
        $(`#tab-${tab.dataset.tab}`).classList.add('active');
    });
});

// --- Get form values ---
function getFormValues() {
    const values = {};
    FIELDS.forEach((field) => {
        const el = $(`#${field}`);
        values[field] = el ? el.value.trim() : '';
    });
    return values;
}

// --- Set form values ---
function setFormValues(values) {
    FIELDS.forEach((field) => {
        const el = $(`#${field}`);
        if (el && values[field] !== undefined) {
            if (el.tagName === 'SELECT') {
                // Match select option
                for (let i = 0; i < el.options.length; i++) {
                    if (el.options[i].value === values[field]) {
                        el.selectedIndex = i;
                        break;
                    }
                }
            } else {
                el.value = values[field];
            }
        }
    });
}

// --- Generate letter with diff highlighting ---
function generateLetter() {
    aiGeneratedLetter = ''; // Reset AI letter when generating manually
    const template = els.templateEditor.value;
    const values = getFormValues();

    // Parse template into segments: static text and variables
    const parts = [];
    let lastIndex = 0;
    const regex = /\{\{(\w+)\}\}/g;
    let match;

    while ((match = regex.exec(template)) !== null) {
        // Static text before this variable
        if (match.index > lastIndex) {
            parts.push({ type: 'static', text: template.slice(lastIndex, match.index) });
        }
        // Variable
        const key = match[1];
        if (values[key] && values[key].length > 0) {
            parts.push({ type: 'generated', text: values[key], key });
        } else {
            parts.push({ type: 'missing', text: `{{${key}}}`, key });
        }
        lastIndex = match.index + match[0].length;
    }
    // Remaining static text
    if (lastIndex < template.length) {
        parts.push({ type: 'static', text: template.slice(lastIndex) });
    }

    // Build HTML with diff classes
    const html = parts.map((p) => {
        const escaped = escapeHtml(p.text);
        if (p.type === 'static') {
            return escaped;
        } else if (p.type === 'generated') {
            return `<span class="diff-generated" title="Variable: {{${p.key}}}">${escaped}</span>`;
        } else {
            return `<span class="diff-missing" title="Non renseigne: {{${p.key}}}">${escaped}</span>`;
        }
    }).join('');

    els.preview.innerHTML = html;
    els.outputActions.style.display = 'flex';
    els.previewLegend.style.display = 'flex';

    // Switch to preview tab
    $$('.tab').forEach((t) => t.classList.remove('active'));
    $$('.tab-content').forEach((c) => c.classList.remove('active'));
    $$('.tab')[0].classList.add('active');
    $('#tab-preview').classList.add('active');

    showToast('Lettre generee !');
}

// --- Get plain text version ---
function getPlainText() {
    // If AI letter exists, use it
    if (aiGeneratedLetter) {
        return aiGeneratedLetter;
    }
    // Otherwise, use template with variable replacement
    const template = els.templateEditor.value;
    const values = getFormValues();
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return values[key] || match;
    });
}

// --- Copy ---
function copyToClipboard() {
    const text = getPlainText();
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copie dans le presse-papiers !');
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('Copie dans le presse-papiers !');
    });
}

// --- Download ---
function downloadTxt() {
    const text = getPlainText();
    const values = getFormValues();
    const filename = `Lettre_${values.nom_agence || 'motivation'}.txt`
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_\-\.àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]/g, '');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Fichier telecharge !');
}

// --- Reset ---
function resetForm() {
    aiGeneratedLetter = '';
    FIELDS.forEach((field) => {
        const el = $(`#${field}`);
        if (el) {
            if (el.tagName === 'SELECT') {
                el.selectedIndex = 0;
            } else {
                el.value = '';
            }
        }
    });
    els.autoAgencyName.value = '';
    els.preview.innerHTML = '<p class="placeholder-msg">Remplissez les champs ou utilisez la <strong>generation automatique</strong> puis cliquez sur <strong>Generer la lettre</strong>.</p>';
    els.outputActions.style.display = 'none';
    els.previewLegend.style.display = 'none';
    showToast('Formulaire reinitialise');
}

// --- Store AI-generated letter ---
let aiGeneratedLetter = '';

// --- Analysis state ---
let analysisResult = null;
let pendingCorrections = {};

// --- Show AI letter in preview with diff ---
function showAiLetter(letterText) {
    aiGeneratedLetter = letterText;
    const template = els.templateEditor.value;

    // Build diff: compare template static parts with the AI letter
    // We highlight the entire AI letter as "generated" content
    // but keep the structure visible
    const templateLines = template.split('\n');
    const letterLines = letterText.split('\n');

    let html = '';
    for (let i = 0; i < letterLines.length; i++) {
        const line = letterLines[i];
        const templateLine = templateLines[i] || '';

        // Check if this line exists identically in template (static)
        const cleanTemplate = templateLine.replace(/\{\{\w+\}\}/g, '').trim();
        const cleanLetter = line.trim();

        if (cleanTemplate === cleanLetter && cleanLetter.length > 0) {
            // Line is identical to template static part
            html += escapeHtml(line);
        } else if (cleanLetter.length === 0) {
            // Empty line
            html += '\n';
        } else {
            // Line has been rewritten by AI
            html += `<span class="diff-generated">${escapeHtml(line)}</span>`;
        }

        if (i < letterLines.length - 1) html += '\n';
    }

    els.preview.innerHTML = html;
    els.outputActions.style.display = 'flex';
    els.previewLegend.style.display = 'flex';

    // Switch to preview tab
    $$('.tab').forEach((t) => t.classList.remove('active'));
    $$('.tab-content').forEach((c) => c.classList.remove('active'));
    $$('.tab')[0].classList.add('active');
    $('#tab-preview').classList.add('active');
}

// --- Auto-generate with AI ---
async function autoGenerate() {
    const agencyName = els.autoAgencyName.value.trim();
    if (!agencyName) {
        showToast('Entrez un nom d\'agence');
        els.autoAgencyName.focus();
        return;
    }

    // Show spinner
    els.btnAutoText.style.display = 'none';
    els.btnAutoSpinner.style.display = 'inline-flex';
    els.btnAutoGenerate.disabled = true;

    try {
        const template = els.templateEditor.value;
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom_agence: agencyName, template }),
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.error || 'Erreur lors de la generation');
            return;
        }

        // Fill fields with AI response - use formal name if available
        const formalName = data.nom_agence_formel || agencyName;
        data.nom_agence = formalName;
        setFormValues(data);
        $('#nom_agence').value = formalName;

        // Show the AI-written letter if available, otherwise fallback to template
        if (data.generated_letter) {
            showAiLetter(data.generated_letter);
            showToast(`Lettre personnalisee pour "${formalName}" generee !`);
        } else {
            generateLetter();
            showToast(`Informations sur "${agencyName}" generees !`);
        }

    } catch (err) {
        showToast('Erreur de connexion au serveur');
        console.error(err);
    } finally {
        // Hide spinner
        els.btnAutoText.style.display = 'inline';
        els.btnAutoSpinner.style.display = 'none';
        els.btnAutoGenerate.disabled = false;
    }
}

// --- Local Storage: Templates ---
function getSavedTemplates() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.templates)) || [];
    } catch {
        return [];
    }
}

function saveTemplate() {
    const name = prompt('Nom du template :');
    if (!name) return;

    const templates = getSavedTemplates();
    templates.push({ name, content: els.templateEditor.value });
    localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(templates));
    renderSavedTemplates();
    showToast(`Template "${name}" sauvegarde !`);
}

function loadTemplate(index) {
    const templates = getSavedTemplates();
    if (templates[index]) {
        els.templateEditor.value = templates[index].content;
        showToast(`Template "${templates[index].name}" charge !`);
    }
}

function deleteTemplate(index) {
    const templates = getSavedTemplates();
    const name = templates[index]?.name;
    templates.splice(index, 1);
    localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(templates));
    renderSavedTemplates();
    showToast(`Template "${name}" supprime`);
}

function renderSavedTemplates() {
    const templates = getSavedTemplates();
    if (templates.length === 0) {
        els.savedTemplatesList.innerHTML = '<span class="empty-msg">Aucun template sauvegarde</span>';
        return;
    }
    els.savedTemplatesList.innerHTML = templates.map((t, i) => `
        <div class="saved-item">
            <span title="${escapeAttr(t.name)}">${escapeHtml(t.name)}</span>
            <button class="btn btn-load" onclick="loadTemplate(${i})">Charger</button>
            <button class="btn btn-danger" onclick="deleteTemplate(${i})">&#10005;</button>
        </div>
    `).join('');
}

// --- Local Storage: Agencies ---
function getSavedAgencies() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.agencies)) || [];
    } catch {
        return [];
    }
}

function saveAgency() {
    const values = getFormValues();
    const name = values.nom_agence || prompt('Nom de l\'agence :');
    if (!name) return;

    const agencies = getSavedAgencies();
    agencies.push({ name, values });
    localStorage.setItem(STORAGE_KEYS.agencies, JSON.stringify(agencies));
    renderSavedAgencies();
    showToast(`Agence "${name}" sauvegardee !`);
}

function loadAgency(index) {
    const agencies = getSavedAgencies();
    if (agencies[index]) {
        setFormValues(agencies[index].values);
        showToast(`Agence "${agencies[index].name}" chargee !`);
    }
}

function deleteAgency(index) {
    const agencies = getSavedAgencies();
    const name = agencies[index]?.name;
    agencies.splice(index, 1);
    localStorage.setItem(STORAGE_KEYS.agencies, JSON.stringify(agencies));
    renderSavedAgencies();
    showToast(`Agence "${name}" supprimee`);
}

function renderSavedAgencies() {
    const agencies = getSavedAgencies();
    if (agencies.length === 0) {
        els.savedAgenciesList.innerHTML = '<span class="empty-msg">Aucune agence sauvegardee</span>';
        return;
    }
    els.savedAgenciesList.innerHTML = agencies.map((a, i) => `
        <div class="saved-item">
            <span title="${escapeAttr(a.name)}">${escapeHtml(a.name)}</span>
            <button class="btn btn-load" onclick="loadAgency(${i})">Charger</button>
            <button class="btn btn-danger" onclick="deleteAgency(${i})">&#10005;</button>
        </div>
    `).join('');
}

// --- Toast ---
function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    setTimeout(() => els.toast.classList.remove('show'), 2500);
}

// --- Utils ---
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// --- Analysis: Score class helper ---
function getScoreClass(score) {
    if (score < 5) return 'low';
    if (score < 7) return 'mid';
    return 'high';
}

// --- Analysis: Analyze template ---
async function analyzeTemplate() {
    const template = els.templateEditor.value.trim();
    if (!template) {
        showToast('Aucun template a analyser');
        return;
    }

    els.btnAnalyzeText.style.display = 'none';
    els.btnAnalyzeSpinner.style.display = 'inline-flex';
    els.btnAnalyze.disabled = true;

    try {
        const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ template }),
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.error || 'Erreur lors de l\'analyse');
            return;
        }

        analysisResult = data;
        pendingCorrections = {};
        renderAnalysisDashboard(data);

        // Switch to analysis tab
        $$('.tab').forEach((t) => t.classList.remove('active'));
        $$('.tab-content').forEach((c) => c.classList.remove('active'));
        $$('.tab')[2].classList.add('active');
        $('#tab-analysis').classList.add('active');

        showToast('Analyse terminee !');

    } catch (err) {
        showToast('Erreur de connexion au serveur');
        console.error(err);
    } finally {
        els.btnAnalyzeText.style.display = 'inline';
        els.btnAnalyzeSpinner.style.display = 'none';
        els.btnAnalyze.disabled = false;
    }
}

// --- Analysis: Render dashboard ---
function renderAnalysisDashboard(data) {
    const globalClass = getScoreClass(data.score_global);
    const circumference = 2 * Math.PI * 40;
    const offset = circumference - (data.score_global / 10) * circumference;
    const ringColor = globalClass === 'low' ? '#DC2626' : globalClass === 'mid' ? '#D97706' : '#3A7D34';

    const summaryHtml = `
        <div class="analysis-summary">
            <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#E0DDD8" stroke-width="8"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="${ringColor}" stroke-width="8"
                    stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                    stroke-linecap="round" transform="rotate(-90 50 50)"
                    style="transition: stroke-dashoffset 1s ease;"/>
                <text x="50" y="55" text-anchor="middle" font-size="22" font-weight="700"
                    fill="${ringColor}">${data.score_global}</text>
            </svg>
            <p class="analysis-verdict">${escapeHtml(data.verdict)}</p>
        </div>
    `;

    const criteriaHtml = data.criteres.map((c, index) => {
        const cls = getScoreClass(c.score);
        const showFix = c.score < 7;
        return `
            <div class="criterion-card score-${cls}" data-criterion-index="${index}">
                <div class="criterion-header">
                    <span class="criterion-name">${escapeHtml(c.nom)}</span>
                    <span class="score-badge ${cls}">${c.score}</span>
                </div>
                <p class="criterion-feedback">${escapeHtml(c.feedback)}</p>
                ${showFix ? `
                    <button class="btn btn-fix" onclick="fixCriterion(${index})">
                        <span class="btn-fix-text">Corriger avec l'IA</span>
                        <span class="btn-fix-spinner" style="display:none;">
                            <span class="spinner"></span>
                            Correction...
                        </span>
                    </button>
                    <div class="correction-zone" id="correction-${index}" style="display:none;"></div>
                ` : ''}
            </div>
        `;
    }).join('');

    els.analysisDashboard.innerHTML = `
        ${summaryHtml}
        <div class="analysis-grid">
            ${criteriaHtml}
        </div>
    `;
}

// --- Analysis: Fix one criterion ---
async function fixCriterion(index) {
    if (!analysisResult) return;
    const criterion = analysisResult.criteres[index];
    const template = els.templateEditor.value;

    const card = document.querySelector(`.criterion-card[data-criterion-index="${index}"]`);
    const btnText = card.querySelector('.btn-fix-text');
    const btnSpinner = card.querySelector('.btn-fix-spinner');
    const btn = card.querySelector('.btn-fix');
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline-flex';
    btn.disabled = true;

    try {
        const res = await fetch('/api/fix-criterion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                template,
                criterion_id: criterion.id,
                criterion_name: criterion.nom,
                feedback: criterion.feedback,
                extrait_concerne: criterion.extrait_concerne,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.error || 'Erreur lors de la correction');
            return;
        }

        pendingCorrections[index] = data;

        const zone = document.querySelector(`#correction-${index}`);
        zone.innerHTML = `
            <p class="correction-label">Avant :</p>
            <div class="correction-before">${escapeHtml(data.original)}</div>
            <p class="correction-label">Apres :</p>
            <div class="correction-after">${escapeHtml(data.corrected)}</div>
            <p class="correction-explanation">${escapeHtml(data.explanation)}</p>
            <div class="correction-actions">
                <button class="btn btn-small" onclick="applyCorrection(${index})">Appliquer</button>
                <button class="btn btn-secondary" onclick="dismissCorrection(${index})">Ignorer</button>
            </div>
        `;
        zone.style.display = 'block';

    } catch (err) {
        showToast('Erreur de connexion au serveur');
        console.error(err);
    } finally {
        btnText.style.display = 'inline';
        btnSpinner.style.display = 'none';
        btn.disabled = false;
    }
}

// --- Analysis: Apply correction ---
function applyCorrection(index) {
    const correction = pendingCorrections[index];
    if (!correction) return;

    const template = els.templateEditor.value;
    const newTemplate = template.replace(correction.original, correction.corrected);

    if (newTemplate === template) {
        showToast('Passage non trouve exactement. Verifiez manuellement.');
        return;
    }

    els.templateEditor.value = newTemplate;

    const card = document.querySelector(`.criterion-card[data-criterion-index="${index}"]`);
    const badge = card.querySelector('.score-badge');
    badge.textContent = '\u2713';
    badge.className = 'score-badge high';
    card.className = 'criterion-card score-high';

    const zone = document.querySelector(`#correction-${index}`);
    zone.style.display = 'none';
    const btn = card.querySelector('.btn-fix');
    if (btn) btn.style.display = 'none';

    delete pendingCorrections[index];
    showToast('Correction appliquee au template !');
}

// --- Analysis: Dismiss correction ---
function dismissCorrection(index) {
    const zone = document.querySelector(`#correction-${index}`);
    zone.style.display = 'none';
    delete pendingCorrections[index];
}

// --- Events ---
els.btnGenerate.addEventListener('click', generateLetter);
els.btnReset.addEventListener('click', resetForm);
els.btnCopy.addEventListener('click', copyToClipboard);
els.btnDownload.addEventListener('click', downloadTxt);
els.btnSaveTemplate.addEventListener('click', saveTemplate);
els.btnSaveAgency.addEventListener('click', saveAgency);
els.btnAutoGenerate.addEventListener('click', autoGenerate);
els.btnAnalyze.addEventListener('click', analyzeTemplate);

// Allow Enter in auto-generate input
els.autoAgencyName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        autoGenerate();
    }
});

// --- Init ---
renderSavedTemplates();
renderSavedAgencies();
