const $ = (id) => document.getElementById(id);

const state = {
    uiLang: 'no',
    last: {
        raw: '',
        parsed: null,
        fileCount: 0,
        hasIndex: false
    }
};

const endpoints = {
    'openai': 'https://api.openai.com/v1/chat/completions',
    'anthropic': 'https://api.anthropic.com/v1/messages', // Note: Client-side Anthropic calls often fail due to CORS, usually need proxy. But for this tool we stick to standard patterns.
    'anthropic-danger': 'https://api.anthropic.com/v1/messages',
    'openrouter': 'https://openrouter.ai/api/v1/chat/completions',
    'google': 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', // Google REST is complex, sticking to OpenAI compat providers is safer usually. Let's map Gemini to OpenRouter or standard OpenAI compat if possible for simplicity, currently standard OpenAI pattern:
    // actually, let's keep it simple. Most users use OpenAI or OpenRouter.
    'local': 'http://localhost:1234/v1/chat/completions'
};

const modelConfig = {
    // OpenAI Models
    'gpt-4o': 'https://api.openai.com/v1/chat/completions',
    'o1-preview': 'https://api.openai.com/v1/chat/completions',
    'o1-mini': 'https://api.openai.com/v1/chat/completions',
    'gpt-5': 'https://openrouter.ai/api/v1/chat/completions',
    'gpt-5-mini': 'https://openrouter.ai/api/v1/chat/completions',
    'gpt-5.1-codex-max': 'https://openrouter.ai/api/v1/chat/completions',
    'gpt-4.1': 'https://openrouter.ai/api/v1/chat/completions',

    // Anthropic Models
    'claude-sonnet-4.5': 'https://openrouter.ai/api/v1/chat/completions',
    'claude-opus-4.5': 'https://openrouter.ai/api/v1/chat/completions',

    // Google (GenAI / Gemini Series) - Using correct API model names
    'gemini-3-pro-preview': 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    'gemini-3-flash-preview': 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    'gemini-2.5-pro-preview-06-05': 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    'gemini-2.5-flash-preview-05-20': 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    'gemini-2.5-flash-lite-preview-06-17': 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    'gemini-2.0-flash': 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    'gemini-2.0-flash-lite': 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',

    // Others/OpenRouter
    'grok-code-fast-1': 'https://openrouter.ai/api/v1/chat/completions',
    'raptor-mini-preview': 'https://openrouter.ai/api/v1/chat/completions',

    // Local
    'local-model': 'http://localhost:1234/v1/chat/completions'
};

const i18n = {
    no: {
        subTitle: 'Fra idé til startklar kode på sekunder',
        toggle: 'Bytt',
        generator: 'Generator',
        help: 'Hjelp',
        tForm: 'Prosjekt',
        lType: 'Type',
        lLevel: 'Kompleksitet',
        lName: 'Prosjektnavn',
        lGoal: 'Hva skal den gjøre',
        lUsers: 'Målgruppe',
        lData: 'Data og lagring',
        lConstraints: 'Begrensninger',
        lStack: 'Teknologi du vil bruke',
        lLang: 'Output språk',
        lFiles: 'Output type',
        tApi: 'Modell',
        lEndpoint: 'API endpoint',
        hEndpoint: 'Du kan endre til annen leverandør hvis du vil',
        lModel: 'Modellnavn',
        lKey: 'API key',
        lRemember: 'Lagring',
        hRemember: 'Lagring skjer i localStorage på denne maskinen',
        lTemp: 'Temperatur',
        gen: 'Generer',
        copy: 'Kopier output',
        dl: 'Last ned index.html',
        reset: 'Nullstill',
        out: 'Output',
        outNone: 'ingen',
        hOut: 'Appen prøver å parse JSON, ellers vises rå tekst',
        preview: 'Preview',
        showFiles: 'Vis filforslag',
        noteKey: 'Tips: legg aldri API key i generert kode',
        statusReady: 'klar',
        statusNeedKey: 'mangler API key',
        statusCalling: 'kaller modell',
        statusDone: 'ferdig',
        statusFail: 'feil',
        statusWarn: 'advarsel',
        phName: 'f.eks. leselogg, secscan mini, timeplan',
        phGoal: 'Beskriv funksjoner og brukerflyt. Skriv konkret.',
        phUsers: 'f.eks. lærere, elever, privatbruk',
        phData: 'f.eks. kun localStorage, ingen persondata',
        phConstraints: 'f.eks. ingen backend, offline first, ingen innlogging',
        phStack: 'f.eks. ren HTML, React, Vite, Python FastAPI',
        phKey: 'Lagres ikke i output',
        optComplexSimple: 'Enkel',
        optComplexMedium: 'Middels',
        optComplexLarge: 'Stor',
        optFileSingle: 'Kun index.html',
        optFileMulti: 'Flere filer',
        optRemNo: 'Ikke lagre',
        optRemLocal: 'Lagre lokalt i nettleser',
        optTypeExt: 'Browser extension'
    },
    en: {
        subTitle: 'From idea to ready-to-use code in seconds',
        toggle: 'Switch',
        generator: 'Generator',
        help: 'Help',
        tForm: 'Project',
        lType: 'Type',
        lLevel: 'Complexity',
        lName: 'Project name',
        lGoal: 'What it should do',
        lUsers: 'Target users',
        lData: 'Data and storage',
        lConstraints: 'Constraints',
        lStack: 'Tech you want',
        lLang: 'Output language',
        lFiles: 'Output mode',
        tApi: 'Model',
        lEndpoint: 'API endpoint',
        hEndpoint: 'You can swap provider if you want',
        lModel: 'Model name',
        lKey: 'API key',
        lRemember: 'Storage',
        hRemember: 'Stored in localStorage on this device',
        lTemp: 'Temperature',
        gen: 'Generate',
        copy: 'Copy output',
        dl: 'Download index.html',
        reset: 'Reset',
        out: 'Output',
        outNone: 'none',
        hOut: 'App tries JSON parse, otherwise raw text is shown',
        preview: 'Preview',
        showFiles: 'Show file suggestions',
        noteKey: 'Tip: never put API keys in generated code',
        statusReady: 'ready',
        statusNeedKey: 'missing API key',
        statusCalling: 'calling model',
        statusDone: 'done',
        statusFail: 'error',
        statusWarn: 'warning',
        phName: 'e.g. reading log, secscan mini, schedule',
        phGoal: 'Describe features and user flow. Be specific.',
        phUsers: 'e.g. teachers, students, personal use',
        phData: 'e.g. only localStorage, no personal data',
        phConstraints: 'e.g. no backend, offline first, no login',
        phStack: 'e.g. vanilla HTML, React, Vite, Python FastAPI',
        phKey: 'Not stored in output',
        optComplexSimple: 'Simple',
        optComplexMedium: 'Medium',
        optComplexLarge: 'Large',
        optFileSingle: 'Single file (index.html)',
        optFileMulti: 'Multiple files',
        optRemNo: 'Do not save',
        optRemLocal: 'Save locally in browser',
        optTypeExt: 'Browser extension'
    }
};

function setStatus(kind, text) {
    const dot = $('statusDot');
    dot.className = 'dot' + (kind ? ' ' + kind : '');
    $('statusText').textContent = text;
}

function setApiState() {
    const key = $('apiKey').value.trim();
    $('apiState').textContent = key ? 'ok' : i18n[state.uiLang].statusNeedKey;
}

function applyLang() {
    const t = i18n[state.uiLang];
    $('toggleLang').textContent = t.toggle;
    $('subTitle').textContent = t.subTitle;
    $('tabGen').textContent = t.generator;
    $('tabHelp').textContent = t.help;
    $('tForm').textContent = t.tForm;
    $('lType').textContent = t.lType;
    $('lLevel').textContent = t.lLevel;
    $('lName').textContent = t.lName;
    $('lGoal').textContent = t.lGoal;
    $('lUsers').textContent = t.lUsers;
    $('lData').textContent = t.lData;
    $('lConstraints').textContent = t.lConstraints;
    $('lStack').textContent = t.lStack;
    $('lLang').textContent = t.lLang;
    $('lFiles').textContent = t.lFiles;
    $('tApi').textContent = t.tApi;
    $('lEndpoint').textContent = t.lEndpoint;
    $('hEndpoint').textContent = t.hEndpoint;
    $('lModel').textContent = t.lModel;
    $('lKey').textContent = t.lKey;
    $('lRemember').textContent = t.lRemember;
    $('hRemember').textContent = t.hRemember;
    $('lTemp').textContent = t.lTemp;
    $('btnGenerate').textContent = t.gen;
    $('btnCopy').textContent = t.copy;
    $('btnDownload').textContent = t.dl;
    $('btnClear').textContent = t.reset;
    $('tOut').textContent = t.out;
    $('hOut').textContent = t.hOut;
    $('btnPreview').textContent = t.preview;
    $('btnShowFiles').textContent = t.showFiles;
    $('noteKey').textContent = t.noteKey;
    $('langPill').querySelector('.mono').textContent = state.uiLang.toUpperCase();

    // Dropdown options
    const setOpt = (id, val, text) => {
        const el = $(id).querySelector(`option[value="${val}"]`);
        if (el) el.textContent = text;
    };

    setOpt('complexity', 'simple', t.optComplexSimple);
    setOpt('complexity', 'medium', t.optComplexMedium);
    setOpt('complexity', 'large', t.optComplexLarge);

    setOpt('fileMode', 'single', t.optFileSingle);
    setOpt('fileMode', 'multi', t.optFileMulti);

    setOpt('rememberKey', 'no', t.optRemNo);
    setOpt('rememberKey', 'local', t.optRemLocal);

    setOpt('appType', 'extension', t.optTypeExt);

    const outLang = $('outputLang').value;
    if (outLang !== state.uiLang) {
        $('outputLang').value = state.uiLang;
    }

    if (!$('statusText').textContent || $('statusText').textContent === i18n.en.statusReady || $('statusText').textContent === i18n.no.statusReady) {
        setStatus('', t.statusReady);
    }


    updateMetaDisplay();

    // Update placeholders
    $('projectName').placeholder = t.phName;
    $('goal').placeholder = t.phGoal;
    $('users').placeholder = t.phUsers;
    $('data').placeholder = t.phData;
    $('constraints').placeholder = t.phConstraints;
    $('stack').placeholder = t.phStack;
    $('apiKey').placeholder = t.phKey;

    setApiState();
}

function tabTo(which) {
    const isGen = which === 'gen';
    $('tabGen').setAttribute('aria-selected', String(isGen));
    $('tabHelp').setAttribute('aria-selected', String(!isGen));
    $('panelGen').classList.toggle('hidden', !isGen);
    $('panelHelp').classList.toggle('hidden', isGen);
}

function safeJsonParse(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) return null;

    try {
        return JSON.parse(trimmed);
    } catch { }

    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
        const slice = trimmed.slice(start, end + 1);
        try { return JSON.parse(slice); } catch { }
    }

    return null;
}

function normalizeParsed(obj) {
    if (!obj || typeof obj !== 'object') return null;
    const out = {
        index_html: '',
        files: [],
        notes: ''
    };

    if (typeof obj.index_html === 'string') out.index_html = obj.index_html;
    if (Array.isArray(obj.files)) {
        out.files = obj.files
            .filter(f => f && typeof f.path === 'string' && typeof f.content === 'string')
            .map(f => ({ path: f.path, content: f.content }));
    }
    if (typeof obj.notes === 'string') out.notes = obj.notes;

    return out;
}

function enableOutputActions(on) {
    $('btnCopy').disabled = !on;
    $('btnDownload').disabled = !on;
    $('btnPreview').disabled = !on;
    $('btnShowFiles').disabled = !on;
}

function renderOutput(raw) {
    state.last.raw = raw || '';
    const parsed = normalizeParsed(safeJsonParse(state.last.raw));
    state.last.parsed = parsed;

    const t = i18n[state.uiLang];
    if (parsed && parsed.index_html) {
        $('output').textContent = parsed.index_html;

        // Update state
        state.last.hasIndex = true;
        state.last.fileCount = parsed.files ? parsed.files.length : 0;

        updateMetaDisplay();
        enableOutputActions(true);
        return;
    }

    $('output').textContent = state.last.raw;

    // Update state
    state.last.hasIndex = false;
    state.last.fileCount = 0;

    updateMetaDisplay();
    enableOutputActions(!!state.last.raw.trim());
}

function updateMetaDisplay() {
    const t = i18n[state.uiLang];
    const { hasIndex, fileCount } = state.last;

    if (!hasIndex && !state.last.raw.trim()) {
        $('outMeta').textContent = t.outNone;
        return;
    }

    if (hasIndex) {
        if (fileCount > 0) {
            const fileText = state.uiLang === 'no' ? 'filer' : 'files';
            $('outMeta').textContent = `index.html + ${fileCount} ${fileText}`;
        } else {
            $('outMeta').textContent = 'index.html';
        }
    } else {
        $('outMeta').textContent = t.outNone;
    }
}

function buildPrompt() {
    const outLang = $('outputLang').value;
    const wantsMulti = $('fileMode').value === 'multi';

    const spec = {
        app_type: $('appType').value,
        complexity: $('complexity').value,
        project_name: $('projectName').value.trim(),
        goal: $('goal').value.trim(),
        users: $('users').value.trim(),
        data: $('data').value.trim(),
        constraints: $('constraints').value.trim(),
        stack: $('stack').value.trim(),
        output_language: outLang,
        output_mode: wantsMulti ? 'multi' : 'single'
    };

    const sys = outLang === 'no'
        ? `Du lager startklare prosjekter for vibe coding. Du leverer alltid konkrete, kjørbare filer. Ingen forklaringer utenom en kort README hvis multi er valgt.`
        : `You generate starter projects for vibe coding. Always output runnable files. No explanations except a short README if multi is selected.`;

    const format = outLang === 'no'
        ? `Svar kun som JSON. Schema:\n{\n  "index_html": "...",\n  "files": [\n    {"path":"style.css","content":"..."},\n    {"path":"app.js","content":"..."},\n    {"path":"README.md","content":"..."},\n    {"path":".gitignore","content":"..."},\n    {"path":".env.example","content":"..."}\n  ],\n  "notes": "kort, valgfritt"\n}\n\nRegler:\n1) index_html må være komplett HTML med inline eller eksterne referanser avhengig av output_mode.\n2) Ingen API keys i kode.\n3) Bruk tydelig struktur, ren UI, og eksempeldata der det trengs.\n4) Hvis output_mode er single: legg all CSS og JS inline i index_html, og sett files til tom liste.\n5) Hvis output_mode er multi: index_html refererer til style.css og app.js og files inkluderer minst de filene, README, gitignore, env.example.`
        : `Return JSON only. Schema:\n{\n  "index_html": "...",\n  "files": [\n    {"path":"style.css","content":"..."},\n    {"path":"app.js","content":"..."},\n    {"path":"README.md","content":"..."},\n    {"path":".gitignore","content":"..."},\n    {"path":".env.example","content":"..."}\n  ],\n  "notes": "short, optional"\n}\n\nRules:\n1) index_html must be complete HTML with inline or external references depending on output_mode.\n2) Never include API keys in code.\n3) Use clear structure, clean UI, and sample data if needed.\n4) If output_mode is single: inline all CSS and JS in index_html and set files to empty.\n5) If output_mode is multi: index_html references style.css and app.js and files includes at least those, README, gitignore, env.example.`;

    const user = (outLang === 'no'
        ? `Spesifikasjon:\n${JSON.stringify(spec, null, 2)}\n\nLag et prosjekt som matcher dette. Prioriter at det faktisk kjører uten ekstra avhengigheter. Hvis stack antyder rammeverk, lag en minimal variant som fortsatt er lett å lime inn i VS Code.`
        : `Spec:\n${JSON.stringify(spec, null, 2)}\n\nCreate a project matching this. Prioritize runnable output without extra dependencies. If stack suggests a framework, keep it minimal and easy to paste into VS Code.`);

    return { sys, user };
}

async function callModel() {
    const t = i18n[state.uiLang];
    const endpoint = $('endpoint').value.trim();
    const model = $('model').value.trim();
    const apiKey = $('apiKey').value.trim();
    const temp = Number($('temperature').value);

    // Provider‑key validation – give a clear warning before sending request
    if (apiKey) {
        let expectedPrefix = '';
        if (endpoint.includes('openai.com')) {
            expectedPrefix = 'sk-';
        } else if (endpoint.includes('openrouter.ai')) {
            expectedPrefix = 'or-';
        } else if (endpoint.includes('generativelanguage.googleapis.com')) {
            expectedPrefix = 'AIza';
        }
        if (expectedPrefix && !apiKey.startsWith(expectedPrefix)) {
            const warnMsg = state.uiLang === 'no'
                ? `API‑nøkkel ser ikke ut til å passe til valgt leverandør (forventet prefiks ${expectedPrefix}).`
                : `API key does not appear to match the selected provider (expected prefix ${expectedPrefix}).`;
            setStatus('warn', warnMsg);
            $('apiKey').focus();
            return;
        }
        // Update hint with expected prefix (if any)
        if (expectedPrefix) {
            $('keyHint').textContent = `Expected prefix: ${expectedPrefix}`;
        } else {
            $('keyHint').textContent = '';
        }
    }

    if (!apiKey) {
        setStatus('warn', t.statusNeedKey);
        $('apiKey').focus();
        return;
    }
    enableOutputActions(false);

    // Build prompt before calling API
    const { sys, user } = buildPrompt();

    // Show calling status and disable generate button
    setStatus('', t.statusCalling);
    $('btnGenerate').disabled = true;

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                temperature: temp,
                messages: [
                    { role: 'system', content: sys },
                    { role: 'user', content: user }
                ]
            })
        });

        if (!res.ok) {
            const text = await res.text();
            renderOutput(text);

            let msg = `${t.statusFail}: ${res.status}`;
            if (res.status === 429) {
                if (endpoint.includes('googleapis')) {
                    msg = state.uiLang === 'no' ? 'Google API kvote nådd (ofte gratisgrense)' : 'Google API quota exceeded (often free tier limit)';
                } else if (endpoint.includes('openai')) {
                    msg = state.uiLang === 'no' ? 'OpenAI rate limit (sjekk credits)' : 'OpenAI rate limit (check credits)';
                } else {
                    msg = state.uiLang === 'no' ? 'Rate limit nådd (429)' : 'Rate limit exceeded (429)';
                }
            } else if (res.status === 404) {
                msg = state.uiLang === 'no' ? 'Modell ikke funnet (sjekk navn)' : 'Model not found (check name)';
            } else if (res.status === 401) {
                // Provider‑specific guidance for invalid key
                if (endpoint.includes('openai.com')) {
                    msg = state.uiLang === 'no' ? 'Ugyldig OpenAI‑API‑key – sjekk at du bruker en gyldig OpenAI‑nøkkel.' : 'Invalid OpenAI API key – verify you are using a valid OpenAI key.';
                } else if (endpoint.includes('openrouter.ai')) {
                    msg = state.uiLang === 'no' ? 'Ugyldig OpenRouter‑API‑key – sjekk at du bruker en gyldig OpenRouter‑nøkkel.' : 'Invalid OpenRouter API key – verify you are using a valid OpenRouter key.';
                } else if (endpoint.includes('generativelanguage.googleapis.com')) {
                    msg = state.uiLang === 'no' ? 'Ugyldig Google‑API‑key – sjekk at du bruker en gyldig Google‑nøkkel.' : 'Invalid Google API key – verify you are using a valid Google key.';
                } else {
                    msg = state.uiLang === 'no' ? 'Ugyldig API‑key' : 'Invalid API key';
                }
            } else if (res.status === 503 || res.status === 500) {
                msg = state.uiLang === 'no' ? 'Serverfeil (prøv igjen)' : 'Server error (try again)';
            }

            setStatus('bad', msg);
            return;
        }

        const json = await res.json();
        const content = json?.choices?.[0]?.message?.content;
        if (typeof content !== 'string') {
            renderOutput(JSON.stringify(json, null, 2));
            setStatus('warn', t.statusWarn);
            return;
        }

        const t = i18n[state.uiLang];
        renderOutput(content);
        setStatus('good', t.statusDone);

    } catch (e) {
        const t = i18n[state.uiLang];
        renderOutput(String(e));
        setStatus('bad', t.statusFail);
    } finally {
        $('btnGenerate').disabled = false;
    }
}

function rememberKeyMaybe() {
    const mode = $('rememberKey').value;
    const key = $('apiKey').value;
    if (mode === 'local') {
        localStorage.setItem('vibe_idea_builder_api_key', key);
    } else {
        localStorage.removeItem('vibe_idea_builder_api_key');
    }
}

function loadRememberedKey() {
    const saved = localStorage.getItem('vibe_idea_builder_api_key');
    if (saved) {
        $('apiKey').value = saved;
        $('rememberKey').value = 'local';
    }
}

function copyOutput() {
    const text = $('output').textContent || '';
    navigator.clipboard.writeText(text);
}

function downloadIndex() {
    const parsed = state.last.parsed;
    const content = (parsed && parsed.index_html) ? parsed.index_html : ($('output').textContent || '');
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function openPreview() {
    const parsed = state.last.parsed;
    const html = (parsed && parsed.index_html) ? parsed.index_html : ($('output').textContent || '');
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
}

function showFiles() {
    const parsed = state.last.parsed;
    const outLang = $('outputLang').value;
    if (!parsed || !parsed.files || parsed.files.length === 0) {
        const msg = outLang === 'no'
            ? 'Ingen ekstra filer foreslått. Bytt Output type til Flere filer og generer på nytt.'
            : 'No extra files suggested. Switch Output mode to Multi and generate again.';
        alert(msg);
        return;
    }
    const list = parsed.files.map(f => `\n\n### ${f.path}\n\n${f.content}`).join('');
    const text = (outLang === 'no'
        ? `Filforslag:${list}`
        : `File suggestions:${list}`);
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write('<pre style="white-space:pre-wrap;font-family:ui-monospace,Menlo,Consolas,monospace;padding:16px">' + escapeHtml(text) + '</pre>');
    w.document.close();
}

function escapeHtml(s) {
    return String(s)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

function clearAll() {
    $('appType').value = 'webapp';
    $('complexity').value = 'simple';
    $('projectName').value = '';
    $('goal').value = '';
    $('users').value = '';
    $('data').value = '';
    $('constraints').value = '';
    $('stack').value = '';
    $('fileMode').value = 'single';
    $('temperature').value = '0.5';
    renderOutput('');
    enableOutputActions(false);
    setStatus('', i18n[state.uiLang].statusReady);
}

$('toggleLang').addEventListener('click', () => {
    state.uiLang = state.uiLang === 'no' ? 'en' : 'no';
    applyLang();
});

$('tabGen').addEventListener('click', () => tabTo('gen'));
$('tabHelp').addEventListener('click', () => tabTo('help'));

$('btnGenerate').addEventListener('click', async () => {
    rememberKeyMaybe();
    setApiState();
    await callModel();
});

$('btnCopy').addEventListener('click', copyOutput);
$('btnDownload').addEventListener('click', downloadIndex);
$('btnPreview').addEventListener('click', openPreview);
$('btnShowFiles').addEventListener('click', showFiles);
$('btnClear').addEventListener('click', () => {
    localStorage.removeItem('vibe_idea_builder_api_key');
    $('apiKey').value = '';
    $('rememberKey').value = 'no';
    clearAll();
    setApiState();
});

$('model').addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'custom') {
        // If custom, we don't change the endpoint, letting user type
        return;
    }

    if (modelConfig[val]) {
        $('endpoint').value = modelConfig[val];

        // Flash the endpoint field to show it changed
        const el = $('endpoint');
        el.style.backgroundColor = 'var(--primary-glow)';
        setTimeout(() => el.style.backgroundColor = '', 300);
    }
});

$('apiKey').addEventListener('input', () => setApiState());

loadRememberedKey();
applyLang();
clearAll();
setApiState();
