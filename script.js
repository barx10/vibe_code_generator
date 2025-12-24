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
        heroBadge: '✨ AI-drevet kodegenerator',
        heroTitle: 'Bygg apper<br><span class="gradient-text">uten å kode</span>',
        heroSubtitle: 'Beskriv idéen din, velg teknologi, og få startklar kode på sekunder. Perfekt for nybegynnere og raske prototyper.',
        heroFeature1: 'Klar på sekunder',
        heroFeature2: 'Én fil, fungerer overalt',
        heroFeature3: 'Din nøkkel, ditt innhold',
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
        lConstraints: '⚙️ Krav til appen',
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
        dlAll: '📦 Last ned alle filer',
        reset: 'Nullstill',
        out: 'Output',
        outNone: 'ingen',
        hOut: 'Appen prøver å parse JSON, ellers vises rå tekst',
        preview: '👁️ Preview',
        showFiles: '📂 Vis alle filer',
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
        optTypeExt: 'Browser extension',
        hConstraints: 'Velg egenskaper appen skal ha (valgfritt)',
        hStack: 'Velg rammeverk – ren HTML anbefales for nybegynnere',
        optNoBackend: '🚫 Kun frontend (ingen server)',
        optOffline: '📴 Fungerer offline',
        optNoLogin: '🔓 Åpen (ingen innlogging)',
        optMobile: '📱 Mobilvennlig',
        optNoDb: '💾 Kun lokal lagring',
        optStackHtml: 'Ren HTML/CSS/JS (anbefalt)',
        optStackTailwind: 'HTML + Tailwind CSS',
        optStackReact: 'React',
        optStackVue: 'Vue',
        optStackSvelte: 'Svelte',
        optStackNext: 'Next.js',
        optStackFlask: 'Python + Flask',
        optStackFastapi: 'Python + FastAPI',
        optStackExpress: 'Node.js + Express',
        optStackCustom: 'Egendefinert...',
        phStackCustom: 'Skriv inn teknologi...',
        optGroupBeginner: 'Nybegynnervennlig',
        optGroupJs: 'JavaScript-rammeverk',
        optGroupBackend: 'Backend',
        optGroupOther: 'Annet',
        // Help page
        helpTitle: '🚀 Kom i gang på 5 minutter',
        helpStep1Title: '📋 Steg 1: Få en API-nøkkel (gratis)',
        helpStep1Desc: 'Du trenger en nøkkel for å bruke AI-modellen. Velg én av leverandørene under:',
        helpStep2Title: '✏️ Steg 2: Fyll ut skjemaet',
        helpStep3Title: '🎉 Steg 3: Bruk koden',
        tipNameTitle: 'Prosjektnavn',
        tipNameDesc: 'Gi prosjektet et kort navn, f.eks. "todo-app" eller "quiz-spill"',
        tipGoalTitle: 'Hva skal den gjøre',
        tipGoalDesc: 'Beskriv hva appen skal gjøre. Jo mer detaljert, jo bedre resultat. Eksempel: "En huskeliste-app der jeg kan legge til oppgaver, markere dem som ferdig, og slette dem"',
        tipTechTitle: 'Teknologi',
        tipTechDesc: 'Velg "Ren HTML/CSS/JS" hvis du er nybegynner. Dette gir deg én fil som fungerer rett i nettleseren!',
        useStep1Title: 'Klikk "Generer"',
        useStep1Desc: 'Vent noen sekunder mens AI-en lager koden',
        useStep2Title: 'Last ned filen',
        useStep2Desc: 'Klikk "Last ned index.html" for å lagre filen',
        useStep3Title: 'Åpne i nettleser',
        useStep3Desc: 'Dobbeltklikk på filen for å åpne den. Ferdig! 🎊',
        helpFaqTitle: '❓ Ofte stilte spørsmål',
        faq1Q: 'Hva er en API-nøkkel?',
        faq1A: 'En API-nøkkel er som et passord som lar denne appen snakke med AI-tjenesten. Den er gratis å få, men hold den hemmelig!',
        faq2Q: 'Koster det penger?',
        faq2A: 'De fleste AI-leverandører har en gratis kvote. For hobbyprosjekter vil du vanligvis aldri betale noe.',
        faq3Q: 'Jeg får feilmelding - hva gjør jeg?',
        faq3A: 'Sjekk at: 1) API-nøkkelen er riktig kopiert, 2) Du har valgt en modell som passer til din leverandør, 3) Prøv å trykke Generer på nytt.',
        faq4Q: 'Kan jeg redigere koden etterpå?',
        faq4A: 'Ja! Åpne filen i et program som VS Code, Notepad++, eller til og med vanlig Notepad. Du kan endre tekst, farger og mer.',
        helpAdvancedTitle: '🔧 For viderekomne',
        helpAdvancedDesc: 'Vil du lære mer? Her er noen tips:',
        advTip1: 'Installer',
        advTip1b: 'for bedre kodeeditoring',
        advTip2: 'Bruk "Flere filer" output for større prosjekter',
        advTip3: 'Prøv',
        advTip3b: 'eller',
        advTip3c: 'når du er klar',
        advTip4: 'Lær',
        advTip4b: 'for å lagre versjoner',
        advTip5: 'Deploy gratis med',
        advTip5b: 'eller',
        advTip6: 'Lær grunnleggende',
        advTip6b: 'og'
    },
    en: {
        subTitle: 'From idea to ready-to-use code in seconds',
        heroBadge: '✨ AI-powered code generator',
        heroTitle: 'Build apps<br><span class="gradient-text">without coding</span>',
        heroSubtitle: 'Describe your idea, choose technology, and get ready-to-run code in seconds. Perfect for beginners and rapid prototypes.',
        heroFeature1: 'Ready in seconds',
        heroFeature2: 'One file, works everywhere',
        heroFeature3: 'Your key, your content',
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
        lConstraints: '⚙️ App requirements',
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
        dlAll: '📦 Download all files',
        reset: 'Reset',
        out: 'Output',
        outNone: 'none',
        hOut: 'App tries JSON parse, otherwise raw text is shown',
        preview: '👁️ Preview',
        showFiles: '📂 Show all files',
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
        optTypeExt: 'Browser extension',
        hConstraints: 'Select features your app should have (optional)',
        hStack: 'Choose framework – vanilla HTML recommended for beginners',
        optNoBackend: '🚫 Frontend only (no server)',
        optOffline: '📴 Works offline',
        optNoLogin: '🔓 Open (no login)',
        optMobile: '📱 Mobile-friendly',
        optNoDb: '💾 Local storage only',
        optStackHtml: 'Vanilla HTML/CSS/JS (recommended)',
        optStackTailwind: 'HTML + Tailwind CSS',
        optStackReact: 'React',
        optStackVue: 'Vue',
        optStackSvelte: 'Svelte',
        optStackNext: 'Next.js',
        optStackFlask: 'Python + Flask',
        optStackFastapi: 'Python + FastAPI',
        optStackExpress: 'Node.js + Express',
        optStackCustom: 'Custom...',
        phStackCustom: 'Enter technology...',
        optGroupBeginner: 'Beginner-friendly',
        optGroupJs: 'JavaScript frameworks',
        optGroupBackend: 'Backend',
        optGroupOther: 'Other',
        // Help page
        helpTitle: '🚀 Get started in 5 minutes',
        helpStep1Title: '📋 Step 1: Get an API key (free)',
        helpStep1Desc: 'You need a key to use the AI model. Choose one of the providers below:',
        helpStep2Title: '✏️ Step 2: Fill out the form',
        helpStep3Title: '🎉 Step 3: Use the code',
        tipNameTitle: 'Project name',
        tipNameDesc: 'Give the project a short name, e.g. "todo-app" or "quiz-game"',
        tipGoalTitle: 'What it should do',
        tipGoalDesc: 'Describe what the app should do. The more detailed, the better the result. Example: "A todo list app where I can add tasks, mark them as done, and delete them"',
        tipTechTitle: 'Technology',
        tipTechDesc: 'Choose "Vanilla HTML/CSS/JS" if you are a beginner. This gives you one file that works right in the browser!',
        useStep1Title: 'Click "Generate"',
        useStep1Desc: 'Wait a few seconds while the AI creates the code',
        useStep2Title: 'Download the file',
        useStep2Desc: 'Click "Download index.html" to save the file',
        useStep3Title: 'Open in browser',
        useStep3Desc: 'Double-click the file to open it. Done! 🎊',
        helpFaqTitle: '❓ Frequently asked questions',
        faq1Q: 'What is an API key?',
        faq1A: 'An API key is like a password that lets this app talk to the AI service. It is free to get, but keep it secret!',
        faq2Q: 'Does it cost money?',
        faq2A: 'Most AI providers have a free quota. For hobby projects you will usually never pay anything.',
        faq3Q: 'I get an error - what do I do?',
        faq3A: 'Check that: 1) The API key is copied correctly, 2) You have selected a model that matches your provider, 3) Try clicking Generate again.',
        faq4Q: 'Can I edit the code afterwards?',
        faq4A: 'Yes! Open the file in a program like VS Code, Notepad++, or even regular Notepad. You can change text, colors and more.',
        helpAdvancedTitle: '🔧 For advanced users',
        helpAdvancedDesc: 'Want to learn more? Here are some tips:',
        advTip1: 'Install',
        advTip1b: 'for better code editing',
        advTip2: 'Use "Multiple files" output for larger projects',
        advTip3: 'Try',
        advTip3b: 'or',
        advTip3c: 'when you are ready',
        advTip4: 'Learn',
        advTip4b: 'to save versions',
        advTip5: 'Deploy for free with',
        advTip5b: 'or',
        advTip6: 'Learn basic',
        advTip6b: 'and'
    }
};

function setStatus(kind, text) {
    const dot = $('statusDot');
    dot.className = 'dot' + (kind ? ' ' + kind : '');
    $('statusText').textContent = text;
}

function showProgress(show) {
    const container = $('progressContainer');
    if (show) {
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
}

function updateProgress(percent, text) {
    $('progressFill').style.width = percent + '%';
    $('progressText').textContent = text;
    
    // Update icon based on progress
    const icons = ['⚡', '🔗', '📤', '🧠', '📥', '🔧', '✅'];
    const iconIndex = Math.min(Math.floor(percent / 15), icons.length - 1);
    $('progressIcon').textContent = icons[iconIndex];
}

function setApiState() {
    const key = $('apiKey').value.trim();
    $('apiState').textContent = key ? 'ok' : i18n[state.uiLang].statusNeedKey;
}

function applyLang() {
    const t = i18n[state.uiLang];
    // Hero section
    $('heroBadge').textContent = t.heroBadge;
    $('heroTitle').innerHTML = t.heroTitle;
    $('heroSubtitle').textContent = t.heroSubtitle;
    $('heroFeature1').textContent = t.heroFeature1;
    $('heroFeature2').textContent = t.heroFeature2;
    $('heroFeature3').textContent = t.heroFeature3;
    
    $('toggleLang').textContent = t.toggle;
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
    $('btnDownloadAll').textContent = t.dlAll;
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

    // Update stack dropdown options
    setOpt('stack', 'html-css-js', t.optStackHtml);
    setOpt('stack', 'html-tailwind', t.optStackTailwind);
    setOpt('stack', 'react', t.optStackReact);
    setOpt('stack', 'vue', t.optStackVue);
    setOpt('stack', 'svelte', t.optStackSvelte);
    setOpt('stack', 'nextjs', t.optStackNext);
    setOpt('stack', 'python-flask', t.optStackFlask);
    setOpt('stack', 'python-fastapi', t.optStackFastapi);
    setOpt('stack', 'nodejs-express', t.optStackExpress);
    setOpt('stack', 'custom', t.optStackCustom);

    // Update optgroup labels
    const stackOptgroups = $('stack').querySelectorAll('optgroup');
    if (stackOptgroups[0]) stackOptgroups[0].label = t.optGroupBeginner;
    if (stackOptgroups[1]) stackOptgroups[1].label = t.optGroupJs;
    if (stackOptgroups[2]) stackOptgroups[2].label = t.optGroupBackend;
    if (stackOptgroups[3]) stackOptgroups[3].label = t.optGroupOther;

    // Update constraint checkbox labels
    document.querySelector('[data-i18n="optNoBackend"]').textContent = t.optNoBackend;
    document.querySelector('[data-i18n="optOffline"]').textContent = t.optOffline;
    document.querySelector('[data-i18n="optNoLogin"]').textContent = t.optNoLogin;
    document.querySelector('[data-i18n="optMobile"]').textContent = t.optMobile;
    document.querySelector('[data-i18n="optNoDb"]').textContent = t.optNoDb;

    // Update hints
    $('hConstraints').textContent = t.hConstraints;
    $('hStack').textContent = t.hStack;
    $('stackCustom').placeholder = t.phStackCustom;

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
    $('apiKey').placeholder = t.phKey;

    // Update help page
    $('helpTitle').textContent = t.helpTitle;
    $('helpStep1Title').textContent = t.helpStep1Title;
    $('helpStep1Desc').textContent = t.helpStep1Desc;
    $('helpStep2Title').textContent = t.helpStep2Title;
    $('helpStep3Title').textContent = t.helpStep3Title;
    $('tipNameTitle').textContent = t.tipNameTitle;
    $('tipNameDesc').textContent = t.tipNameDesc;
    $('tipGoalTitle').textContent = t.tipGoalTitle;
    $('tipGoalDesc').textContent = t.tipGoalDesc;
    $('tipTechTitle').textContent = t.tipTechTitle;
    $('tipTechDesc').textContent = t.tipTechDesc;
    $('useStep1Title').textContent = t.useStep1Title;
    $('useStep1Desc').textContent = t.useStep1Desc;
    $('useStep2Title').textContent = t.useStep2Title;
    $('useStep2Desc').textContent = t.useStep2Desc;
    $('useStep3Title').textContent = t.useStep3Title;
    $('useStep3Desc').textContent = t.useStep3Desc;
    $('helpFaqTitle').textContent = t.helpFaqTitle;
    $('faq1Q').textContent = t.faq1Q;
    $('faq1A').textContent = t.faq1A;
    $('faq2Q').textContent = t.faq2Q;
    $('faq2A').textContent = t.faq2A;
    $('faq3Q').textContent = t.faq3Q;
    $('faq3A').textContent = t.faq3A;
    $('faq4Q').textContent = t.faq4Q;
    $('faq4A').textContent = t.faq4A;
    $('helpAdvancedTitle').textContent = t.helpAdvancedTitle;
    $('helpAdvancedDesc').textContent = t.helpAdvancedDesc;
    $('advTip1').textContent = t.advTip1;
    $('advTip1b').textContent = t.advTip1b;
    $('advTip2').textContent = t.advTip2;
    $('advTip3').textContent = t.advTip3;
    $('advTip3b').textContent = t.advTip3b;
    $('advTip3c').textContent = t.advTip3c;
    $('advTip4').textContent = t.advTip4;
    $('advTip4b').textContent = t.advTip4b;
    $('advTip5').textContent = t.advTip5;
    $('advTip5b').textContent = t.advTip5b;
    $('advTip6').textContent = t.advTip6;
    $('advTip6b').textContent = t.advTip6b;

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
    
    // Show/hide multi-file buttons based on whether we have extra files
    const parsed = state.last.parsed;
    const hasFiles = parsed && parsed.files && parsed.files.length > 0;
    
    $('btnShowFiles').disabled = !on || !hasFiles;
    $('btnShowFiles').classList.toggle('hidden', !hasFiles);
    $('btnDownloadAll').disabled = !on || !hasFiles;
    $('btnDownloadAll').classList.toggle('hidden', !hasFiles);
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

    // Collect constraints from checkboxes
    const constraintCheckboxes = document.querySelectorAll('input[name="constraint"]:checked');
    const constraints = Array.from(constraintCheckboxes).map(cb => cb.value).join(', ');

    // Get stack value (handle custom option)
    let stackValue = $('stack').value;
    if (stackValue === 'custom') {
        stackValue = $('stackCustom').value.trim() || 'html-css-js';
    }

    const spec = {
        app_type: $('appType').value,
        complexity: $('complexity').value,
        project_name: $('projectName').value.trim(),
        goal: $('goal').value.trim(),
        users: $('users').value.trim(),
        data: $('data').value.trim(),
        constraints: constraints,
        stack: stackValue,
        output_language: outLang,
        output_mode: wantsMulti ? 'multi' : 'single'
    };

    const currentYear = new Date().getFullYear();
    
    const sys = outLang === 'no'
        ? `Du er en ekspert frontend-utvikler som lager visuelt imponerende, startklare prosjekter. Du leverer alltid konkret, kjørbar kode med moderne design. Ingen forklaringer utenom en kort README hvis multi er valgt.

DESIGN-KRAV (VIKTIG):
- Bruk en mørk, moderne fargeprofil (dark mode) som standard
- Legg til subtile gradienter, shadows og hover-effekter
- Inkluder smooth CSS-animasjoner og transitions
- Bruk Google Fonts (Inter, Outfit, eller lignende moderne fonter)
- Lag responsivt design med CSS Grid eller Flexbox
- Legg til en visuelt tiltalende header/hero-seksjon
- Bruk ikoner (emoji eller Unicode) for visuell interesse
- Inkluder loading states og micro-interactions
- IKKE inkluder footer med "laget i" eller årstall - la det være opp til brukeren
- Bruk CSS custom properties (variabler) for farger
- Bruk moderne ${currentYear} designtrender`
        : `You are an expert frontend developer creating visually stunning, ready-to-run projects. Always output concrete, runnable code with modern design. No explanations except a short README if multi is selected.

DESIGN REQUIREMENTS (IMPORTANT):
- Use a dark, modern color scheme (dark mode) as default
- Add subtle gradients, shadows and hover effects
- Include smooth CSS animations and transitions
- Use Google Fonts (Inter, Outfit, or similar modern fonts)
- Create responsive design with CSS Grid or Flexbox
- Add a visually appealing header/hero section
- Use icons (emoji or Unicode) for visual interest
- Include loading states and micro-interactions
- Do NOT include a footer with "made in" or any year - leave that to the user
- Use CSS custom properties (variables) for colors
- Use modern ${currentYear} design trends`;

    const format = outLang === 'no'
        ? `Svar kun som JSON. Schema:
{
  "index_html": "...",
  "files": [
    {"path":"style.css","content":"..."},
    {"path":"app.js","content":"..."},
    {"path":"README.md","content":"..."},
    {"path":".gitignore","content":"..."},
    {"path":".env.example","content":"..."}
  ],
  "notes": "kort, valgfritt"
}

Regler:
1) index_html må være komplett HTML med inline eller eksterne referanser avhengig av output_mode.
2) Ingen API keys i kode.
3) Bruk tydelig struktur og eksempeldata der det trengs.
4) Hvis output_mode er single: legg all CSS og JS inline i index_html, og sett files til tom liste.
5) Hvis output_mode er multi: index_html refererer til style.css og app.js og files inkluderer minst de filene, README, gitignore, env.example.

STIL-REGLER:
- Bakgrunn: mørk (#0a0a0f eller lignende)
- Primærfarge: en livlig accent (cyan, lilla, eller lignende)
- Tekst: lys på mørk bakgrunn
- Kort/paneler: semi-transparente med border og subtle shadow
- Knapper: gradient eller solid med hover-glow effekt
- Inputs: mørk bakgrunn med subtil border
- Animasjoner: fadeIn, subtle hover transforms, smooth transitions`
        : `Return JSON only. Schema:
{
  "index_html": "...",
  "files": [
    {"path":"style.css","content":"..."},
    {"path":"app.js","content":"..."},
    {"path":"README.md","content":"..."},
    {"path":".gitignore","content":"..."},
    {"path":".env.example","content":"..."}
  ],
  "notes": "short, optional"
}

Rules:
1) index_html must be complete HTML with inline or external references depending on output_mode.
2) Never include API keys in code.
3) Use clear structure and sample data if needed.
4) If output_mode is single: inline all CSS and JS in index_html and set files to empty.
5) If output_mode is multi: index_html references style.css and app.js and files includes at least those, README, gitignore, env.example.

STYLE RULES:
- Background: dark (#0a0a0f or similar)
- Primary color: a vibrant accent (cyan, purple, or similar)
- Text: light on dark background
- Cards/panels: semi-transparent with border and subtle shadow
- Buttons: gradient or solid with hover-glow effect
- Inputs: dark background with subtle border
- Animations: fadeIn, subtle hover transforms, smooth transitions`;

    const user = (outLang === 'no'
        ? `Spesifikasjon:\n${JSON.stringify(spec, null, 2)}\n\n${format}\n\nLag et visuelt imponerende prosjekt som matcher dette. Designet skal se profesjonelt og moderne ut med én gang - dette er viktig for førsteinntrykket! Prioriter at det faktisk kjører uten ekstra avhengigheter.`
        : `Spec:\n${JSON.stringify(spec, null, 2)}\n\n${format}\n\nCreate a visually stunning project matching this. The design should look professional and modern immediately - this is important for first impressions! Prioritize runnable output without extra dependencies.`);

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
    
    // Show progress bar
    showProgress(true);
    updateProgress(10, state.uiLang === 'no' ? '🔗 Kobler til API...' : '🔗 Connecting to API...');

    try {
        updateProgress(25, state.uiLang === 'no' ? '📤 Sender forespørsel...' : '📤 Sending request...');
        
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
        
        updateProgress(50, state.uiLang === 'no' ? '⚡ AI genererer kode...' : '⚡ AI generating code...');

        if (!res.ok) {
            const text = await res.text();
            renderOutput(text);
            showProgress(false);
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

        updateProgress(75, state.uiLang === 'no' ? '📥 Mottar respons...' : '📥 Receiving response...');
        
        const json = await res.json();
        const content = json?.choices?.[0]?.message?.content;
        if (typeof content !== 'string') {
            renderOutput(JSON.stringify(json, null, 2));
            showProgress(false);
            setStatus('warn', t.statusWarn);
            return;
        }

        updateProgress(90, state.uiLang === 'no' ? '🔧 Behandler kode...' : '🔧 Processing code...');

        const t = i18n[state.uiLang];
        renderOutput(content);
        
        updateProgress(100, state.uiLang === 'no' ? '✅ Ferdig!' : '✅ Done!');
        setTimeout(() => showProgress(false), 1000);
        
        setStatus('good', t.statusDone);

    } catch (e) {
        const t = i18n[state.uiLang];
        renderOutput(String(e));
        showProgress(false);
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
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'preview-overlay';
    overlay.innerHTML = `
        <div class="preview-modal">
            <div class="preview-header">
                <span class="preview-title">✨ Preview</span>
                <div class="preview-actions">
                    <button class="preview-btn" id="previewNewTab" title="Åpne i ny fane">↗</button>
                    <button class="preview-btn preview-close" id="previewClose" title="Lukk">✕</button>
                </div>
            </div>
            <iframe class="preview-iframe" sandbox="allow-scripts allow-same-origin"></iframe>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    const iframe = overlay.querySelector('.preview-iframe');
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();
    
    // Close handlers
    overlay.querySelector('#previewClose').addEventListener('click', () => {
        overlay.remove();
    });
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
    
    // Open in new tab
    overlay.querySelector('#previewNewTab').addEventListener('click', () => {
        const w = window.open('', '_blank');
        if (w) {
            w.document.open();
            w.document.write(html);
            w.document.close();
        }
    });
    
    // ESC to close
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

function downloadAllFiles() {
    const parsed = state.last.parsed;
    if (!parsed) return;
    
    // Create a simple HTML page with all files that user can copy
    const outLang = $('outputLang').value;
    
    // Collect all files
    const allFiles = [];
    if (parsed.index_html) {
        allFiles.push({ path: 'index.html', content: parsed.index_html });
    }
    if (parsed.files) {
        allFiles.push(...parsed.files);
    }
    
    // Create a single file with all content clearly separated
    let combined = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${outLang === 'no' ? 'Alle filer' : 'All Files'}</title>
    <style>
        body { font-family: system-ui, sans-serif; background: #1a1a2e; color: #eee; padding: 40px; max-width: 1000px; margin: 0 auto; }
        h1 { color: #38bdf8; }
        .file { background: #0f0f23; border: 1px solid #333; border-radius: 8px; margin: 20px 0; overflow: hidden; }
        .file-header { background: #252545; padding: 12px 16px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
        .file-header span { color: #38bdf8; }
        .file-content { padding: 16px; white-space: pre-wrap; font-family: 'Fira Code', monospace; font-size: 13px; overflow-x: auto; margin: 0; }
        .copy-btn { background: #38bdf8; color: #000; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; }
        .copy-btn:hover { background: #7dd3fc; }
        .instructions { background: #252545; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .instructions ol { margin: 10px 0; padding-left: 20px; }
    </style>
</head>
<body>
    <h1>📦 ${outLang === 'no' ? 'Dine genererte filer' : 'Your Generated Files'}</h1>
    <div class="instructions">
        <strong>${outLang === 'no' ? 'Slik bruker du filene:' : 'How to use these files:'}</strong>
        <ol>
            <li>${outLang === 'no' ? 'Lag en ny mappe på datamaskinen din' : 'Create a new folder on your computer'}</li>
            <li>${outLang === 'no' ? 'Kopier innholdet fra hver fil nedenfor' : 'Copy the content from each file below'}</li>
            <li>${outLang === 'no' ? 'Lagre hver fil med riktig filnavn i mappen' : 'Save each file with the correct filename in the folder'}</li>
            <li>${outLang === 'no' ? 'Åpne index.html i nettleseren' : 'Open index.html in your browser'}</li>
        </ol>
    </div>
`;
    
    allFiles.forEach((f, i) => {
        const escapedContent = f.content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        combined += `
    <div class="file">
        <div class="file-header">
            <span>📄 ${f.path}</span>
            <button class="copy-btn" onclick="copyFile(${i})">${outLang === 'no' ? 'Kopier' : 'Copy'}</button>
        </div>
        <pre class="file-content" id="file-${i}">${escapedContent}</pre>
    </div>
`;
    });
    
    combined += `
    <script>
        const fileContents = ${JSON.stringify(allFiles.map(f => f.content))};
        function copyFile(idx) {
            navigator.clipboard.writeText(fileContents[idx]).then(() => {
                event.target.textContent = '✓ ${outLang === 'no' ? 'Kopiert!' : 'Copied!'}';
                setTimeout(() => event.target.textContent = '${outLang === 'no' ? 'Kopier' : 'Copy'}', 2000);
            });
        }
    <\/script>
</body>
</html>`;
    
    // Download as HTML file
    const blob = new Blob([combined], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prosjekt-filer.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function showFiles() {
    const parsed = state.last.parsed;
    const outLang = $('outputLang').value;
    if (!parsed || !parsed.files || parsed.files.length === 0) {
        return;
    }
    
    // Create modal for files
    const overlay = document.createElement('div');
    overlay.className = 'preview-overlay';
    
    const filesHtml = parsed.files.map(f => `
        <div class="file-item">
            <div class="file-header">
                <span class="file-name">📄 ${escapeHtml(f.path)}</span>
                <button class="preview-btn copy-file-btn" data-content="${btoa(unescape(encodeURIComponent(f.content)))}" title="Kopier">📋</button>
            </div>
            <pre class="file-content">${escapeHtml(f.content)}</pre>
        </div>
    `).join('');
    
    overlay.innerHTML = `
        <div class="preview-modal files-modal">
            <div class="preview-header">
                <span class="preview-title">📂 ${outLang === 'no' ? 'Alle genererte filer' : 'All generated files'} (${parsed.files.length})</span>
                <div class="preview-actions">
                    <button class="preview-btn preview-close" id="filesClose" title="Lukk">✕</button>
                </div>
            </div>
            <div class="files-container">
                ${filesHtml}
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Copy file content handlers
    overlay.querySelectorAll('.copy-file-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const content = decodeURIComponent(escape(atob(btn.dataset.content)));
            navigator.clipboard.writeText(content);
            btn.textContent = '✓';
            setTimeout(() => btn.textContent = '📋', 1500);
        });
    });
    
    // Close handlers
    overlay.querySelector('#filesClose').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escHandler); }
    });
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
    // Uncheck all constraint checkboxes
    document.querySelectorAll('input[name="constraint"]').forEach(cb => cb.checked = false);
    $('stack').value = 'html-css-js';
    $('stackCustom').value = '';
    $('stackCustom').classList.add('hidden');
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
$('btnDownloadAll').addEventListener('click', downloadAllFiles);
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

// Show/hide custom stack input
$('stack').addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
        $('stackCustom').classList.remove('hidden');
        $('stackCustom').focus();
    } else {
        $('stackCustom').classList.add('hidden');
    }
});

loadRememberedKey();
applyLang();
clearAll();
setApiState();
