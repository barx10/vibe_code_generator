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
        about: 'Om',
        aboutBrand: 'Lærerliv',
        aboutTagline: 'Kom i gang med koding',
        aboutAppTitle: 'Om VibeCoding Idea Builder',
        aboutAppDesc: 'VibeCoding Idea Builder er et gratis verktøy som lar deg bruke AI til å generere startklare webprosjekter. Perfekt for alle som vil lære webutvikling på en praktisk måte.',
        aboutMissionTitle: 'Visjonen',
        aboutMissionDesc: 'Koding bør være tilgjengelig for alle. Ved å kombinere moderne AI-teknologi med pedagogisk design, gjør appen det enklere å ta de første stegene inn i programmeringens verden.',
        aboutContactTitle: 'Kontakt',
        aboutEmailLabel: 'E-post',
        aboutWebLabel: 'Nettside',
        aboutOpenSourceTitle: 'Åpen kildekode',
        aboutOpenSourceDesc: 'Dette prosjektet er åpen kildekode. Du kan se, kopiere og bidra til koden på GitHub.',
        aboutMadeWith: 'Laget med ❤️ for læring',
        tForm: 'Prosjekt',
        lType: 'Type',
        lLevel: 'Kompleksitet',
        lName: 'Prosjektnavn',
        lGoal: 'Hva skal den gjøre',
        lUsers: 'Målgruppe',
        lData: 'Data og lagring',
        lConstraints: '⚙️ Krav til appen',
        lStack: 'Teknologi du vil bruke',
        hStack: 'Velg rammeverk – ren HTML anbefales for nybegynnere',
        stackComplexWarning: '⚠️ Krever Node.js/Python installasjon. Ikke anbefalt for nybegynnere - velg "Ren HTML/CSS/JS" for enklest oppsett!',
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
        dlAll: '📦 Last ned ZIP',  
        reset: 'Nullstill',
        out: 'Output',
        outNone: 'ingen',
        hOut: 'Appen prøver å parse JSON, ellers vises rå tekst',
        preview: '👁️ Preview',
        showFiles: '📂 Vis alle filer',
        noteKey: 'Tips: legg aldri API key i generert kode',
        securityTitle: 'Din nøkkel er trygg',
        securityDesc: 'API-nøkkelen sendes direkte fra din nettleser til valgt leverandør. Den lagres aldri på våre servere – alt skjer lokalt hos deg.',
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
        about: 'About',
        aboutBrand: 'Lærerliv',
        aboutTagline: 'Tools for tomorrow\'s teachers',
        aboutAppTitle: 'About VibeCoding Idea Builder',
        aboutAppDesc: 'VibeCoding Idea Builder is a free tool that lets you use AI to generate ready-to-run web projects. Perfect for teachers, students, and anyone who wants to learn web development in a practical way.',
        aboutMissionTitle: 'Our Vision',
        aboutMissionDesc: 'We believe coding should be accessible to everyone. By combining modern AI technology with pedagogical design, we make it easier to take the first steps into the world of programming.',
        aboutContactTitle: 'Contact',
        aboutEmailLabel: 'Email',
        aboutWebLabel: 'Website',
        aboutOpenSourceTitle: 'Open Source',
        aboutOpenSourceDesc: 'This project is open source. You can view, copy, and contribute to the code on GitHub.',
        aboutMadeWith: 'Made with ❤️ for learning',
        tForm: 'Project',
        lType: 'Type',
        lLevel: 'Complexity',
        lName: 'Project name',
        lGoal: 'What it should do',
        lUsers: 'Target users',
        lData: 'Data and storage',
        lConstraints: '⚙️ App requirements',
        lStack: 'Tech you want',
        hStack: 'Choose framework – plain HTML recommended for beginners',
        stackComplexWarning: '⚠️ Requires Node.js/Python installation. Not recommended for beginners - choose "Plain HTML/CSS/JS" for easiest setup!',
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
        dlAll: '📦 Download ZIP',
        reset: 'Reset',
        out: 'Output',
        outNone: 'none',
        hOut: 'App tries JSON parse, otherwise raw text is shown',
        preview: '👁️ Preview',
        showFiles: '📂 Show all files',
        noteKey: 'Tip: never put API keys in generated code',
        securityTitle: 'Your key is safe',
        securityDesc: 'Your API key is sent directly from your browser to the selected provider. It is never stored on our servers – everything happens locally on your device.',
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
    $('tabAbout').textContent = t.about;
    
    // About page
    $('aboutBrand').textContent = t.aboutBrand;
    $('aboutTagline').textContent = t.aboutTagline;
    $('aboutAppTitle').textContent = t.aboutAppTitle;
    $('aboutAppDesc').textContent = t.aboutAppDesc;
    $('aboutMissionTitle').textContent = t.aboutMissionTitle;
    $('aboutMissionDesc').textContent = t.aboutMissionDesc;
    $('aboutContactTitle').textContent = t.aboutContactTitle;
    $('aboutEmailLabel').textContent = t.aboutEmailLabel;
    $('aboutWebLabel').textContent = t.aboutWebLabel;
    $('aboutOpenSourceTitle').textContent = t.aboutOpenSourceTitle;
    $('aboutOpenSourceDesc').textContent = t.aboutOpenSourceDesc;
    $('aboutMadeWith').textContent = t.aboutMadeWith;
    
    $('tForm').textContent = t.tForm;
    $('lType').textContent = t.lType;
    $('lLevel').textContent = t.lLevel;
    $('lName').textContent = t.lName;
    $('lGoal').textContent = t.lGoal;
    $('lUsers').textContent = t.lUsers;
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
    $('securityTitle').textContent = t.securityTitle;
    $('securityDesc').textContent = t.securityDesc;
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
    const tabs = ['gen', 'help', 'about'];
    tabs.forEach(tab => {
        const isActive = tab === which;
        $('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).setAttribute('aria-selected', String(isActive));
        $('panel' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.toggle('hidden', !isActive);
    });
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
        constraints: constraints,
        stack: stackValue,
        output_language: outLang,
        output_mode: wantsMulti ? 'multi' : 'single'
    };

    const currentYear = new Date().getFullYear();
    
    // Stack-specific instructions
    const stackGuide = {
        'react': outLang === 'no' 
            ? `\n**REACT-SPESIFIKT:**
- Bruk React 18+ med ESM imports fra esm.sh (f.eks. import React from 'https://esm.sh/react@18')
- Inkluder createRoot fra react-dom/client
- Bruk hooks (useState, useEffect, etc.)
- Koden MÅ kjøre direkte i nettleseren uten npm/build - bruk bare ESM imports
- IKKE generer package.json eller npm-skript - det skal kjøre direkte
- Strukturer komponenter logisk med god state management`
            : `\n**REACT-SPECIFIC:**
- Use React 18+ with ESM imports from esm.sh (e.g. import React from 'https://esm.sh/react@18')
- Include createRoot from react-dom/client
- Use hooks (useState, useEffect, etc.)
- Code MUST run directly in browser without npm/build - use ESM imports only
- DO NOT generate package.json or npm scripts - it should run directly
- Structure components logically with good state management`,
        'vue': outLang === 'no'
            ? `\n**VUE-SPESIFIKT:**
- Bruk Vue 3 CDN eller ESM import
- Kan bruke petite-vue for enklere oppsett
- Koden MÅ kjøre direkte i nettleseren`
            : `\n**VUE-SPECIFIC:**
- Use Vue 3 CDN or ESM import
- Can use petite-vue for simpler setup
- Code MUST run directly in browser`,
        'pwa': outLang === 'no'
            ? `\n**PWA-SPESIFIKT:**
- Inkluder manifest.json med korrekte properties (name, short_name, start_url, display, icons)
- Lag en funksjonell service worker (sw.js) med offline cache
- Registrer service worker i index.html
- Inkluder meta-tags for mobile (theme-color, apple-mobile-web-app-capable)
- Bruk localStorage/IndexedDB for data
- Test at offline-funksjonalitet faktisk virker`
            : `\n**PWA-SPECIFIC:**
- Include manifest.json with correct properties (name, short_name, start_url, display, icons)
- Create functional service worker (sw.js) with offline cache
- Register service worker in index.html
- Include meta tags for mobile (theme-color, apple-mobile-web-app-capable)
- Use localStorage/IndexedDB for data
- Ensure offline functionality actually works`
    };
    
    const stackInstructions = stackGuide[stackValue] || stackGuide[spec.app_type] || '';
    
    const sys = outLang === 'no'
        ? `Du er en ekspert fullstack-utvikler som lager FUNGERENDE, startklare prosjekter. Koden må faktisk kjøre - ikke teoretiske eksempler.

KRITISKE REGLER:
1. **FUNKSJONALITET FØRST:** Koden MÅ kjøre uten feil
2. **KOMPLETT IMPLEMENTASJON:** Alle features i goal må være implementert, ikke bare placeholder
3. **INGEN EKSTERNE AVHENGIGHETER SOM KREVER BUILD:** Bruk CDN eller ESM imports hvis nødvendig
4. **REALISTISKE EKSEMPELDATA:** Inkluder faktiske eksempler som demonstrerer funksjonaliteten
5. **FEILHÅNDTERING:** Legg til try/catch og brukervenlige feilmeldinger${stackInstructions}

DESIGN-KRAV:
- Mørk, moderne fargeprofil (dark mode) som standard
- Subtile gradienter, shadows og hover-effekter
- Smooth CSS-animasjoner og transitions
- Google Fonts (Inter, Outfit, eller lignende)
- Responsivt design (CSS Grid/Flexbox)
- Visuelt tiltalende header/hero-seksjon
- Ikoner (emoji eller Unicode)
- Loading states og micro-interactions
- CSS custom properties (variabler)
- IKKE inkluder footer med "laget i" eller årstall`
        : `You are an expert fullstack developer creating WORKING, ready-to-run projects. Code must actually execute - not theoretical examples.

CRITICAL RULES:
1. **FUNCTIONALITY FIRST:** Code MUST run without errors
2. **COMPLETE IMPLEMENTATION:** All features in goal must be implemented, not just placeholders
3. **NO EXTERNAL DEPENDENCIES REQUIRING BUILD:** Use CDN or ESM imports if needed
4. **REALISTIC SAMPLE DATA:** Include actual examples demonstrating functionality
5. **ERROR HANDLING:** Add try/catch and user-friendly error messages${stackInstructions}

DESIGN REQUIREMENTS:
- Dark, modern color scheme (dark mode) as default
- Subtle gradients, shadows and hover effects
- Smooth CSS animations and transitions
- Google Fonts (Inter, Outfit, or similar)
- Responsive design (CSS Grid/Flexbox)
- Visually appealing header/hero section
- Icons (emoji or Unicode)
- Loading states and micro-interactions
- CSS custom properties (variables)
- Do NOT include footer with "made in" or year`;

    const format = outLang === 'no'
        ? `Svar kun som JSON. Schema:
{
  "index_html": "...",
  "files": [
    {"path":"style.css","content":"..."},
    {"path":"app.js","content":"..."},
    {"path":"manifest.json","content":"..."},
    {"path":"sw.js","content":"..."},
    {"path":"README.md","content":"..."},
    {"path":".gitignore","content":"..."}
  ],
  "notes": "kort, valgfritt"
}

VIKTIGE REGLER:
1) **index_html må være komplett og KJØRBAR** - test at alle referanser er korrekte
2) **Ingen API keys eller hemmeligheter i kode**
3) **Bruk faktiske, fungerende eksempeldata** - ikke "TODO" eller placeholder
4) **Single mode:** Legg ALL CSS og JS inline i index_html. files skal være tom liste []
5) **Multi mode:** index_html refererer til eksterne filer (style.css, app.js). files MÅ inneholde:
   - style.css (all CSS-kode)
   - app.js (all JavaScript-kode)
   - README.md (installasjon og bruk)
   - .gitignore (node_modules, .DS_Store, .env)
   - manifest.json (hvis PWA)
   - sw.js (hvis PWA eller offline-first)

STIL-REGLER:
- Bakgrunn: mørk (#0a0a0f eller #0f172a)
- Primærfarge: livlig accent (#38bdf8, #8b5cf6, eller lignende)
- Tekst: #f1f5f9 på mørk bakgrunn
- Kort/paneler: rgba(30, 41, 59, 0.6) med border og subtle shadow
- Knapper: solid farge eller gradient med hover-glow
- Inputs: rgba(15, 23, 42, 0.6) med subtle border
- Animasjoner: fadeIn (0.5s), subtle hover transforms (translateY(-2px)), smooth transitions (0.2s)`
        : `Return JSON only. Schema:
{
  "index_html": "...",
  "files": [
    {"path":"style.css","content":"..."},
    {"path":"app.js","content":"..."},
    {"path":"manifest.json","content":"..."},
    {"path":"sw.js","content":"..."},
    {"path":"README.md","content":"..."},
    {"path":".gitignore","content":"..."}
  ],
  "notes": "short, optional"
}

IMPORTANT RULES:
1) **index_html must be complete and RUNNABLE** - verify all references are correct
2) **No API keys or secrets in code**
3) **Use actual, working sample data** - no "TODO" or placeholders
4) **Single mode:** Inline ALL CSS and JS in index_html. files should be empty list []
5) **Multi mode:** index_html references external files (style.css, app.js). files MUST contain:
   - style.css (all CSS code)
   - app.js (all JavaScript code)
   - README.md (installation and usage)
   - .gitignore (node_modules, .DS_Store, .env)
   - manifest.json (if PWA)
   - sw.js (if PWA or offline-first)

STYLE RULES:
- Background: dark (#0a0a0f or #0f172a)
- Primary color: vibrant accent (#38bdf8, #8b5cf6, or similar)
- Text: #f1f5f9 on dark background
- Cards/panels: rgba(30, 41, 59, 0.6) with border and subtle shadow
- Buttons: solid color or gradient with hover-glow
- Inputs: rgba(15, 23, 42, 0.6) with subtle border
- Animations: fadeIn (0.5s), subtle hover transforms (translateY(-2px)), smooth transitions (0.2s)`;

    const user = (outLang === 'no'
        ? `Spesifikasjon:\n${JSON.stringify(spec, null, 2)}\n\n${format}\n\nLag et FUNGERENDE prosjekt som matcher dette. KRITISK: Koden må faktisk kjøre når brukeren åpner den - test alle referanser og funksjoner. Prioriter at brukeren får en fungerende app, ikke bare pen kode som ikke virker.`
        : `Spec:\n${JSON.stringify(spec, null, 2)}\n\n${format}\n\nCreate a WORKING project matching this. CRITICAL: Code must actually run when user opens it - verify all references and functions. Prioritize giving user a working app, not just pretty code that doesn't work.`);

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

async function downloadAllFiles() {
    const parsed = state.last.parsed;
    if (!parsed) return;
    
    const outLang = $('outputLang').value;
    const stack = $('stack').value;
    const projectName = $('projectName').value || 'prosjekt';
    
    // Collect all files
    const allFiles = [];
    if (parsed.index_html) {
        allFiles.push({ path: 'index.html', content: parsed.index_html });
    }
    if (parsed.files) {
        allFiles.push(...parsed.files);
    }
    
    // Detect if project actually uses ESM imports (no build needed) vs requires npm
    // Check if index.html has importmap or esm.sh imports
    const usesESMImports = parsed.index_html && (
        parsed.index_html.includes('esm.sh') || 
        parsed.index_html.includes('type="importmap"') ||
        parsed.index_html.includes('type="module"')
    );
    
    // Only needs Node.js setup if it's a framework WITHOUT ESM imports
    const needsNodeSetup = ['nextjs'].includes(stack) || 
        (['react', 'vue', 'svelte'].includes(stack) && !usesESMImports);
    
    const needsServer = needsNodeSetup || stack.includes('python') || stack.includes('nodejs');
    
    // Determine if it's a PWA
    const isPWA = allFiles.some(f => f.path === 'manifest.json' || f.path === 'sw.js');
    
    let readmeContent = outLang === 'no' ? 
`# ${projectName}

## 🚀 Kom i gang

### Trinn 1: Pakk ut filene
Denne ZIP-filen inneholder alle filene du trenger. Pakk ut til en mappe på datamaskinen din.

### Trinn 2: ${needsServer ? 'Installer avhengigheter og start server' : 'Åpne i nettleser'}
${needsNodeSetup ? `
⚠️ **Dette prosjektet krever Node.js**

1. Installer Node.js fra https://nodejs.org (velg LTS-versjonen)
2. Åpne Terminal/Command Prompt i prosjektmappen
3. Kjør: \`npm install\` (første gang)
4. Kjør: \`npm run dev\` eller \`npm start\`
5. Åpne nettleseren på den URL-en som vises (vanligvis http://localhost:3000)

**Merk:** Disse filene vil IKKE fungere ved å bare åpne index.html!
` : stack.includes('python') ? `
⚠️ **Dette prosjektet krever Python**

1. Installer Python fra https://python.org
2. Åpne Terminal i prosjektmappen
3. Kjør: \`pip install -r requirements.txt\` (hvis requirements.txt finnes)
4. Kjør: \`python app.py\` eller \`python main.py\`
5. Åpne nettleseren på http://localhost:5000
` : isPWA ? `
✅ **PWA - krever lokal webserver (for service worker)**

**Alternativ 1 - VS Code Live Server (enklest):**
1. Installer VS Code fra https://code.visualstudio.com
2. Installer "Live Server" extension
3. Høyreklikk på \`index.html\` → "Open with Live Server"
4. Appen åpnes automatisk i nettleseren

**Alternativ 2 - Python (hvis du har det installert):**
1. Åpne Terminal i prosjektmappen
2. Kjør: \`python -m http.server 8000\` eller \`python3 -m http.server 8000\`
3. Åpne http://localhost:8000 i nettleseren

**Alternativ 3 - Node.js (hvis du har det installert):**
1. Åpne Terminal i prosjektmappen
2. Kjør: \`npx serve\`
3. Følg instruksjonene for å åpne i nettleseren

**Hvorfor webserver?** Service Workers (for offline-funksjonalitet) krever HTTPS eller localhost. En lokal webserver gir deg localhost.
` : usesESMImports ? `
✅ **React/Vue med ESM imports - ingen build nødvendig!**

**Quickstart (anbefalt):**
1. Installer VS Code fra https://code.visualstudio.com
2. Installer "Live Server" extension
3. Høyreklikk på \`index.html\` → "Open with Live Server"
4. Appen åpnes automatisk!

**Alternativt (uten VS Code):**
- Dobbel-klikk på \`index.html\` - kan fungere, men noen browsere blokkerer CORS
- Python: \`python -m http.server 8000\` → åpne http://localhost:8000
- Node: \`npx serve\` → følg instruksjonene

**Ingen npm install nødvendig!** Koden bruker ESM imports direkte fra CDN.
` : `
✅ **Enkelt oppsett - ingen installasjon nødvendig!**

1. Dobbel-klikk på \`index.html\` for å åpne i nettleseren
2. Alternativt: Høyreklikk → Åpne med → Velg nettleser

Ferdig! Appen kjører direkte i nettleseren.
`}

### Trinn 3: Rediger koden
- Åpne filene i en kodeeditor som VS Code (https://code.visualstudio.com)
- Gjør endringer og lagre - nettleseren oppdaterer automatisk (hvis du bruker Live Server)

## 📁 Filstruktur
${allFiles.map(f => `- \`${f.path}\` - ${f.path.endsWith('.html') ? 'Hovedfil' : f.path.endsWith('.css') ? 'Styling' : f.path.endsWith('.js') ? 'Logikk' : 'Fil'}`).join('\n')}

## 🛠 Nyttige verktøy
- **VS Code**: Gratis kodeeditor med god støtte for HTML/CSS/JS
- **Live Server**: VS Code extension for automatisk oppdatering
- **Chrome DevTools**: F12 i Chrome/Edge for feilsøking

## 📚 Lær mer
- HTML: https://developer.mozilla.org/docs/Web/HTML
- CSS: https://developer.mozilla.org/docs/Web/CSS
- JavaScript: https://developer.mozilla.org/docs/Web/JavaScript
${needsNodeSetup ? `- ${stack === 'react' ? 'React' : stack === 'vue' ? 'Vue' : stack === 'svelte' ? 'Svelte' : 'Next.js'}: https://${stack === 'react' ? 'react.dev' : stack === 'vue' ? 'vuejs.org' : stack === 'svelte' ? 'svelte.dev' : 'nextjs.org'}` : ''}

---
Generert med VibeCoding Idea Builder - https://barx10.github.io/vibe_code_generator/
` : 
`# ${projectName}

## 🚀 Getting Started

### Step 1: Extract Files
This ZIP contains all the files you need. Extract to a folder on your computer.

### Step 2: ${needsServer ? 'Install dependencies and start server' : 'Open in browser'}
${needsNodeSetup ? `
⚠️ **This project requires Node.js**

1. Install Node.js from https://nodejs.org (choose LTS version)
2. Open Terminal/Command Prompt in the project folder
3. Run: \`npm install\` (first time only)
4. Run: \`npm run dev\` or \`npm start\`
5. Open browser at the URL shown (usually http://localhost:3000)

**Note:** These files will NOT work by just opening index.html!
` : stack.includes('python') ? `
⚠️ **This project requires Python**

1. Install Python from https://python.org
2. Open Terminal in the project folder
3. Run: \`pip install -r requirements.txt\` (if requirements.txt exists)
4. Run: \`python app.py\` or \`python main.py\`
5. Open browser at http://localhost:5000
` : isPWA ? `
✅ **PWA - requires local web server (for service worker)**

**Option 1 - VS Code Live Server (easiest):**
1. Install VS Code from https://code.visualstudio.com
2. Install "Live Server" extension
3. Right-click \`index.html\` → "Open with Live Server"
4. App opens automatically in browser

**Option 2 - Python (if installed):**
1. Open Terminal in project folder
2. Run: \`python -m http.server 8000\` or \`python3 -m http.server 8000\`
3. Open http://localhost:8000 in browser

**Option 3 - Node.js (if installed):**
1. Open Terminal in project folder
2. Run: \`npx serve\`
3. Follow instructions to open in browser

**Why web server?** Service Workers (for offline functionality) require HTTPS or localhost. A local web server gives you localhost.
` : usesESMImports ? `
✅ **React/Vue with ESM imports - no build needed!**

**Quickstart (recommended):**
1. Install VS Code from https://code.visualstudio.com
2. Install "Live Server" extension
3. Right-click \`index.html\` → "Open with Live Server"
4. App opens automatically!

**Alternative (without VS Code):**
- Double-click \`index.html\` - may work, but some browsers block CORS
- Python: \`python -m http.server 8000\` → open http://localhost:8000
- Node: \`npx serve\` → follow instructions

**No npm install needed!** Code uses ESM imports directly from CDN.
` : `
✅ **Simple setup - no installation needed!**

1. Double-click \`index.html\` to open in browser
2. Alternative: Right-click → Open with → Choose browser

Done! App runs directly in browser.
`}
2. Alternative: Right-click → Open with → Choose browser

**For PWA/Service Workers:** Use a local web server:
- VS Code: Install "Live Server" extension, right-click index.html → "Open with Live Server"
- Python: Run \`python -m http.server 8000\` and open http://localhost:8000
- Node: Run \`npx serve\` and follow instructions
`}

### Step 3: Edit the code
- Open files in a code editor like VS Code (https://code.visualstudio.com)
- Make changes and save - browser updates automatically (if using Live Server)

## 📁 File Structure
${allFiles.map(f => `- \`${f.path}\` - ${f.path.endsWith('.html') ? 'Main file' : f.path.endsWith('.css') ? 'Styling' : f.path.endsWith('.js') ? 'Logic' : 'File'}`).join('\n')}

## 🛠 Useful Tools
- **VS Code**: Free code editor with great HTML/CSS/JS support
- **Live Server**: VS Code extension for auto-reload
- **Chrome DevTools**: Press F12 in Chrome/Edge for debugging

## 📚 Learn More
- HTML: https://developer.mozilla.org/docs/Web/HTML
- CSS: https://developer.mozilla.org/docs/Web/CSS
- JavaScript: https://developer.mozilla.org/docs/Web/JavaScript
${needsNodeSetup ? `- ${stack === 'react' ? 'React' : stack === 'vue' ? 'Vue' : stack === 'svelte' ? 'Svelte' : 'Next.js'}: https://${stack === 'react' ? 'react.dev' : stack === 'vue' ? 'vuejs.org' : stack === 'svelte' ? 'svelte.dev' : 'nextjs.org'}` : ''}

---
Generated with VibeCoding Idea Builder - https://barx10.github.io/vibe_code_generator/
`;
    
    allFiles.push({ path: 'README.md', content: readmeContent });
    
    // Use JSZip library (we'll load it dynamically)
    if (!window.JSZip) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    const zip = new JSZip();
    allFiles.forEach(f => {
        zip.file(f.path, f.content);
    });
    
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '-')}.zip`;
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
$('tabAbout').addEventListener('click', () => tabTo('about'));

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
    const val = e.target.value;
    if (val === 'custom') {
        $('stackCustom').classList.remove('hidden');
        $('stackCustom').focus();
    } else {
        $('stackCustom').classList.add('hidden');
    }
    
    // Show warning for complex stacks
    const complexStacks = ['react', 'vue', 'svelte', 'nextjs', 'python-flask', 'python-fastapi', 'nodejs-express'];
    const hintEl = $('hStack');
    const t = i18n[state.lang];
    
    if (complexStacks.includes(val)) {
        hintEl.innerHTML = t.stackComplexWarning || '⚠️ Krever Node.js/Python installasjon. Ikke anbefalt for nybegynnere - velg "Ren HTML/CSS/JS" for enklest oppsett!';
        hintEl.style.color = '#f59e0b';
    } else {
        hintEl.textContent = t.hStack;
        hintEl.style.color = '';
    }
});

// Tool info modal data
const toolInfo = {
    no: {
        vscode: {
            icon: '💻',
            title: 'VS Code',
            body: `<p><strong>Visual Studio Code</strong> er en gratis, kraftig kodeeditor fra Microsoft. Den er perfekt for nybegynnere og proffer.</p>
                   <p><strong>Hvorfor bruke VS Code?</strong></p>
                   <ul>
                       <li>🎨 Syntax highlighting gjør koden lettere å lese</li>
                       <li>🔍 IntelliSense gir deg forslag mens du skriver</li>
                       <li>🐛 Innebygd debugger for å finne feil</li>
                       <li>📦 Tusenvis av extensions for ekstra funksjonalitet</li>
                       <li>🆓 Helt gratis!</li>
                   </ul>
                   <p><strong>Kom i gang:</strong> Last ned, åpne mappen med koden din, og begynn å redigere!</p>`,
            link: 'https://code.visualstudio.com/',
            linkText: 'Last ned VS Code →'
        },
        react: {
            icon: '⚛️',
            title: 'React',
            body: `<p><strong>React</strong> er et JavaScript-bibliotek fra Meta (Facebook) for å bygge brukergrensesnitt.</p>
                   <p><strong>Når bør du lære React?</strong></p>
                   <ul>
                       <li>✅ Når du er komfortabel med HTML, CSS og JavaScript</li>
                       <li>✅ Når du vil bygge større, mer komplekse apper</li>
                       <li>✅ Når du trenger gjenbrukbare komponenter</li>
                   </ul>
                   <p><strong>Fordeler:</strong></p>
                   <ul>
                       <li>🧩 Komponenter gjør koden organisert</li>
                       <li>⚡ Rask oppdatering av UI</li>
                       <li>🌍 Enorm community og mange jobber</li>
                   </ul>`,
            link: 'https://react.dev/learn',
            linkText: 'Lær React →'
        },
        vue: {
            icon: '💚',
            title: 'Vue',
            body: `<p><strong>Vue</strong> er et progressivt JavaScript-rammeverk som er kjent for å være lett å lære.</p>
                   <p><strong>Hvorfor Vue?</strong></p>
                   <ul>
                       <li>📖 Veldig god dokumentasjon</li>
                       <li>🎓 Lettere læringskurve enn React</li>
                       <li>🔧 Kan brukes gradvis – start enkelt, utvid etter behov</li>
                       <li>📝 Single File Components holder alt samlet</li>
                   </ul>
                   <p><strong>Perfekt for:</strong> De som vil ha et mildt steg opp fra vanilla JavaScript.</p>`,
            link: 'https://vuejs.org/guide/introduction.html',
            linkText: 'Lær Vue →'
        },
        git: {
            icon: '📦',
            title: 'Git & GitHub',
            body: `<p><strong>Git</strong> er et versjonskontrollsystem. <strong>GitHub</strong> er en plattform for å lagre og dele kode.</p>
                   <p><strong>Hvorfor lære Git?</strong></p>
                   <ul>
                       <li>💾 Lagre alle versjoner av koden din</li>
                       <li>↩️ Gå tilbake til tidligere versjoner hvis noe går galt</li>
                       <li>👥 Samarbeid med andre utviklere</li>
                       <li>📁 Backup av all koden din i skyen</li>
                   </ul>
                   <p><strong>Grunnleggende kommandoer:</strong></p>
                   <ul>
                       <li><code>git init</code> - Start et nytt prosjekt</li>
                       <li><code>git add .</code> - Legg til endringer</li>
                       <li><code>git commit -m "melding"</code> - Lagre endringer</li>
                       <li><code>git push</code> - Last opp til GitHub</li>
                   </ul>`,
            link: 'https://docs.github.com/en/get-started',
            linkText: 'Kom i gang med GitHub →'
        },
        deploy: {
            icon: '🚀',
            title: 'Deploy / Publisering',
            body: `<p>Gjør appen din tilgjengelig på internett – helt <strong>gratis</strong>!</p>
                   <p><strong>Populære alternativer:</strong></p>
                   <ul>
                       <li><strong>GitHub Pages</strong> – Perfekt for enkle HTML-sider. Gratis med GitHub-konto.</li>
                       <li><strong>Vercel</strong> – Best for React, Next.js, Vue. Automatisk deploy fra GitHub.</li>
                       <li><strong>Netlify</strong> – Veldig brukervennlig, dra-og-slipp støtte.</li>
                   </ul>
                   <p><strong>Enkleste metode:</strong></p>
                   <ol>
                       <li>Last opp koden til GitHub</li>
                       <li>Gå til Settings → Pages</li>
                       <li>Velg "main" branch og lagre</li>
                       <li>Vent 1-2 minutter – ferdig! 🎉</li>
                   </ol>`,
            link: 'https://pages.github.com/',
            linkText: 'Prøv GitHub Pages →'
        },
        basics: {
            icon: '📚',
            title: 'HTML, CSS & JavaScript',
            body: `<p>Grunnmuren i all webutvikling. <strong>Lær disse først!</strong></p>
                   <p><strong>HTML</strong> – Strukturen</p>
                   <ul>
                       <li>Tekst, bilder, lenker, knapper</li>
                       <li>Som skjelettet til en nettside</li>
                   </ul>
                   <p><strong>CSS</strong> – Utseendet</p>
                   <ul>
                       <li>Farger, fonter, layout, animasjoner</li>
                       <li>Gjør siden pen og responsiv</li>
                   </ul>
                   <p><strong>JavaScript</strong> – Funksjonaliteten</p>
                   <ul>
                       <li>Interaktivitet, logikk, API-kall</li>
                       <li>Gjør siden "levende"</li>
                   </ul>
                   <p><strong>MDN Web Docs</strong> er den beste ressursen – gratis og grundig!</p>`,
            link: 'https://developer.mozilla.org/en-US/docs/Learn',
            linkText: 'Start å lære på MDN →'
        }
    },
    en: {
        vscode: {
            icon: '💻',
            title: 'VS Code',
            body: `<p><strong>Visual Studio Code</strong> is a free, powerful code editor from Microsoft. Perfect for beginners and pros alike.</p>
                   <p><strong>Why use VS Code?</strong></p>
                   <ul>
                       <li>🎨 Syntax highlighting makes code easier to read</li>
                       <li>🔍 IntelliSense gives you suggestions as you type</li>
                       <li>🐛 Built-in debugger to find errors</li>
                       <li>📦 Thousands of extensions for extra functionality</li>
                       <li>🆓 Completely free!</li>
                   </ul>
                   <p><strong>Get started:</strong> Download, open your code folder, and start editing!</p>`,
            link: 'https://code.visualstudio.com/',
            linkText: 'Download VS Code →'
        },
        react: {
            icon: '⚛️',
            title: 'React',
            body: `<p><strong>React</strong> is a JavaScript library from Meta (Facebook) for building user interfaces.</p>
                   <p><strong>When should you learn React?</strong></p>
                   <ul>
                       <li>✅ When you're comfortable with HTML, CSS and JavaScript</li>
                       <li>✅ When you want to build larger, more complex apps</li>
                       <li>✅ When you need reusable components</li>
                   </ul>
                   <p><strong>Benefits:</strong></p>
                   <ul>
                       <li>🧩 Components keep code organized</li>
                       <li>⚡ Fast UI updates</li>
                       <li>🌍 Huge community and many job opportunities</li>
                   </ul>`,
            link: 'https://react.dev/learn',
            linkText: 'Learn React →'
        },
        vue: {
            icon: '💚',
            title: 'Vue',
            body: `<p><strong>Vue</strong> is a progressive JavaScript framework known for being easy to learn.</p>
                   <p><strong>Why Vue?</strong></p>
                   <ul>
                       <li>📖 Excellent documentation</li>
                       <li>🎓 Gentler learning curve than React</li>
                       <li>🔧 Can be adopted incrementally</li>
                       <li>📝 Single File Components keep everything together</li>
                   </ul>
                   <p><strong>Perfect for:</strong> Those who want a gentle step up from vanilla JavaScript.</p>`,
            link: 'https://vuejs.org/guide/introduction.html',
            linkText: 'Learn Vue →'
        },
        git: {
            icon: '📦',
            title: 'Git & GitHub',
            body: `<p><strong>Git</strong> is a version control system. <strong>GitHub</strong> is a platform for storing and sharing code.</p>
                   <p><strong>Why learn Git?</strong></p>
                   <ul>
                       <li>💾 Save all versions of your code</li>
                       <li>↩️ Go back to previous versions if something breaks</li>
                       <li>👥 Collaborate with other developers</li>
                       <li>📁 Backup all your code in the cloud</li>
                   </ul>
                   <p><strong>Basic commands:</strong></p>
                   <ul>
                       <li><code>git init</code> - Start a new project</li>
                       <li><code>git add .</code> - Add changes</li>
                       <li><code>git commit -m "message"</code> - Save changes</li>
                       <li><code>git push</code> - Upload to GitHub</li>
                   </ul>`,
            link: 'https://docs.github.com/en/get-started',
            linkText: 'Get started with GitHub →'
        },
        deploy: {
            icon: '🚀',
            title: 'Deploy / Publishing',
            body: `<p>Make your app available on the internet – completely <strong>free</strong>!</p>
                   <p><strong>Popular options:</strong></p>
                   <ul>
                       <li><strong>GitHub Pages</strong> – Perfect for simple HTML pages. Free with GitHub account.</li>
                       <li><strong>Vercel</strong> – Best for React, Next.js, Vue. Auto-deploy from GitHub.</li>
                       <li><strong>Netlify</strong> – Very user-friendly, drag-and-drop support.</li>
                   </ul>
                   <p><strong>Easiest method:</strong></p>
                   <ol>
                       <li>Upload code to GitHub</li>
                       <li>Go to Settings → Pages</li>
                       <li>Select "main" branch and save</li>
                       <li>Wait 1-2 minutes – done! 🎉</li>
                   </ol>`,
            link: 'https://pages.github.com/',
            linkText: 'Try GitHub Pages →'
        },
        basics: {
            icon: '📚',
            title: 'HTML, CSS & JavaScript',
            body: `<p>The foundation of all web development. <strong>Learn these first!</strong></p>
                   <p><strong>HTML</strong> – The Structure</p>
                   <ul>
                       <li>Text, images, links, buttons</li>
                       <li>Like the skeleton of a webpage</li>
                   </ul>
                   <p><strong>CSS</strong> – The Appearance</p>
                   <ul>
                       <li>Colors, fonts, layout, animations</li>
                       <li>Makes the page look beautiful and responsive</li>
                   </ul>
                   <p><strong>JavaScript</strong> – The Functionality</p>
                   <ul>
                       <li>Interactivity, logic, API calls</li>
                       <li>Makes the page "come alive"</li>
                   </ul>
                   <p><strong>MDN Web Docs</strong> is the best resource – free and comprehensive!</p>`,
            link: 'https://developer.mozilla.org/en-US/docs/Learn',
            linkText: 'Start learning at MDN →'
        }
    }
};

function openToolModal(tool) {
    const info = toolInfo[state.uiLang][tool];
    if (!info) return;
    
    $('toolModalIcon').textContent = info.icon;
    $('toolModalTitle').textContent = info.title;
    $('toolModalBody').innerHTML = info.body;
    $('toolModalLink').href = info.link;
    $('toolModalLink').textContent = info.linkText;
    
    $('toolModal').classList.remove('hidden');
}

function closeToolModal() {
    $('toolModal').classList.add('hidden');
}

// Tool card click handlers
document.querySelectorAll('.tool-card').forEach(card => {
    card.addEventListener('click', () => {
        openToolModal(card.dataset.tool);
    });
});

// Close modal handlers
$('toolModalClose').addEventListener('click', closeToolModal);
$('toolModal').addEventListener('click', (e) => {
    if (e.target === $('toolModal')) closeToolModal();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('toolModal').classList.contains('hidden')) {
        closeToolModal();
    }
});

loadRememberedKey();
applyLang();
clearAll();
setApiState();
