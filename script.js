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
        tForm: 'Beskriv appen din',
        hTemplates: 'Bruk ✨ Prompt-hjelperen for å få hjelp til å beskrive appen din i detalj og få en premium app med alle finesser!',
        tDetails: 'Tilpass prosjektet',
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
        promptHelper: '✨ Prompt-hjelper',
        promptHelperTitle: '🚀 Lag en Premium App',
        promptHelperDesc: 'Svar på spørsmålene under, så generer vi en detaljert prompt som sikrer at du får en moderne, profesjonell app med alle finesser!',
        promptQ1: '1. Hva slags app vil du lage?',
        promptQ1Placeholder: 'F.eks. quiz-spill, todo-liste, kalkulator, portfolio, chatbot...',
        promptQ2: '2. Hvem er målgruppen?',
        promptQ2Placeholder: 'F.eks. elever i ungdomsskolen, bedrifter, meg selv, gamere...',
        promptQ3: '3. Beskriv hovedfunksjonen i detalj',
        promptQ3Placeholder: 'Skriv hva brukeren skal kunne gjøre, hva som skal skje når de klikker, hvilke resultater de skal se osv.',
        promptQ3Hint: '💡 Tips: Beskriv steg-for-steg hva brukeren skal kunne gjøre. Hva skal skje når de klikker? Hva skal de se? Vær så detaljert som mulig!',
        promptQ4: '4. Hvilke data skal lagres/vises?',
        promptQ4Placeholder: 'F.eks. brukerpoeng, historikk, favoritter, innstillinger...',
        promptQ5: '5. Interaksjoner - hva skal skje når brukeren klikker/skriver?',
        promptQ5Placeholder: 'F.eks. animasjoner, lydeffekter, visuell feedback, hover-effekter...',
        promptQ6: '6. Hvilket design/stemning?',
        promptQ6Options: ['💎 Moderne & Glassmorphic', '🎮 Gamer/Neon/Cyberpunk', '🎨 Fargerik & Leken', '💼 Profesjonell & Minimalistisk', '🌙 Dark Mode Premium', '🌈 Gradient & 3D-effekter', '📱 iOS-inspirert', '🔮 Futuristisk'],
        promptQ7: '7. Spesielle ønsker?',
        promptQ7Placeholder: 'F.eks. dark mode toggle, mobilvennlig, tilgjengelighet, spesifikke farger...',
        promptGenerate: '🚀 Generer Premium Prompt',
        promptInsert: 'Bruk denne prompten',
        promptCancel: 'Avbryt',
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
        optStackReact: 'React (ESM - ingen npm)',
        optStackPwa: 'PWA (Progressive Web App)',
        optStackCustom: 'Egendefinert...',
        phStackCustom: 'Skriv inn teknologi...',
        optGroupBeginner: 'Nybegynnervennlig',
        optGroupAdvanced: 'Avansert',
        optGroupOther: 'Annet',
        // Help page
        helpTitle: '🚀 Kom i gang på 5 minutter',
        helpStep1Title: '📋 Steg 1: Få en API-nøkkel (gratis)',
        helpStep1Desc: 'Du trenger en nøkkel for å bruke AI-modellen. Velg én av leverandørene under:',
        helpStep2Title: '✏️ Steg 2: Fyll ut skjemaet',
        helpStep3Title: '🎉 Steg 3: Bruk koden',
        tipNameTitle: 'Prosjektnavn',
        tipNameDesc: 'Gi prosjektet et kort navn, f.eks. "todo-app" eller "quiz-spill"',
        tipPromptHelperTitle: 'Bruk Prompt-hjelperen!',
        tipPromptHelperDesc: 'Klikk på "✨ Prompt-hjelper" knappen for å få veiledning til å lage en detaljert beskrivelse. Den hjelper deg steg-for-steg med å beskrive appen din, og sikrer at du får en profesjonell app med alle finesser!',
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
        helpAdvancedTitle: '🔧 Neste steg: Utvikle videre',
        helpAdvancedDesc: 'Når du har generert en app, følg disse stegene for å utvikle den videre med nye funksjoner:',
        advTip1: '1. Last ned og installer',
        advTip1b: '– En gratis kodeeditor som gjør det lett å jobbe med HTML/CSS/JS',
        advTip2: '2. Opprett en mappe på PCen din (f.eks. "Dokumenter/MinApp") og lagre den genererte filen der',
        advTip3: '3. Høyreklikk på filen i VS Code → "Open with Live Server" for å se endringer live',
        advTip3b: '(eller bare dobbeltklikk .html-filen for å åpne i nettleser)',
        advTip3c: '',
        advTip4: '4. Nå kan du "vibe" og kode ny funksjonalitet! Prompt AI-en med hva du vil legge til',
        advTip4b: '',
        advTip5: '5. Klar til å publisere? Deploy gratis på',
        advTip5b: 'eller',
        advTip6: '6. Vil du lære mer? Utforsk',
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
        tForm: 'Describe your app',
        hTemplates: 'Use the ✨ Prompt Helper to get help describing your app in detail and get a premium app with all the bells and whistles!',
        tDetails: 'Customize project',
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
        promptHelper: '✨ Prompt Helper',
        promptHelperTitle: '🚀 Create a Premium App',
        promptHelperDesc: 'Answer the questions below, and we\'ll generate a detailed prompt that ensures you get a modern, professional app with all the bells and whistles!',
        promptQ1: '1. What kind of app do you want to create?',
        promptQ1Placeholder: 'E.g. quiz game, todo list, calculator, portfolio, chatbot...',
        promptQ2: '2. Who is the target audience?',
        promptQ2Placeholder: 'E.g. middle school students, businesses, myself, gamers...',
        promptQ3: '3. Describe the main function in detail',
        promptQ3Placeholder: 'Write what the user should be able to do, what happens when they click, what results they should see etc.',
        promptQ3Hint: '💡 Tip: Describe step-by-step what the user should be able to do. What happens when they click? What should they see? Be as detailed as possible!',
        promptQ4: '4. What data should be stored/displayed?',
        promptQ4Placeholder: 'E.g. user score, history, favorites, settings...',
        promptQ5: '5. Interactions - what should happen when user clicks/types?',
        promptQ5Placeholder: 'E.g. animations, sound effects, visual feedback, hover effects...',
        promptQ6: '6. What design/mood?',
        promptQ6Options: ['💎 Modern & Glassmorphic', '🎮 Gamer/Neon/Cyberpunk', '🎨 Colorful & Playful', '💼 Professional & Minimalist', '🌙 Dark Mode Premium', '🌈 Gradient & 3D effects', '📱 iOS-inspired', '🔮 Futuristic'],
        promptQ7: '7. Special requests?',
        promptQ7Placeholder: 'E.g. dark mode toggle, mobile-friendly, accessibility, specific colors...',
        promptGenerate: '🚀 Generate Premium Prompt',
        promptInsert: 'Use this prompt',
        promptCancel: 'Cancel',
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
        optStackReact: 'React (ESM - no npm)',
        optStackPwa: 'PWA (Progressive Web App)',
        optStackCustom: 'Custom...',
        phStackCustom: 'Enter technology...',
        optGroupBeginner: 'Beginner-friendly',
        optGroupAdvanced: 'Advanced',
        optGroupOther: 'Other',
        // Help page
        helpTitle: '🚀 Get started in 5 minutes',
        helpStep1Title: '📋 Step 1: Get an API key (free)',
        helpStep1Desc: 'You need a key to use the AI model. Choose one of the providers below:',
        helpStep2Title: '✏️ Step 2: Fill out the form',
        helpStep3Title: '🎉 Step 3: Use the code',
        tipNameTitle: 'Project name',
        tipNameDesc: 'Give the project a short name, e.g. "todo-app" or "quiz-game"',
        tipPromptHelperTitle: 'Use the Prompt Helper!',
        tipPromptHelperDesc: 'Click the "✨ Prompt Helper" button to get guidance on creating a detailed description. It helps you step-by-step to describe your app, and ensures you get a professional app with all the bells and whistles!',
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
        helpAdvancedTitle: '🔧 Next Step: Develop Further',
        helpAdvancedDesc: 'Once you have generated an app, follow these steps to develop it further with new features:',
        advTip1: '1. Download and install',
        advTip1b: '– A free code editor that makes it easy to work with HTML/CSS/JS',
        advTip2: '2. Create a folder on your PC (e.g. "Documents/MyApp") and save the generated file there',
        advTip3: '3. Right-click the file in VS Code → "Open with Live Server" to see changes live',
        advTip3b: '(or just double-click the .html file to open in browser)',
        advTip3c: '',
        advTip4: '4. Now you can "vibe" and code new functionality! Prompt the AI with what you want to add',
        advTip4b: '',
        advTip5: '5. Ready to publish? Deploy for free on',
        advTip5b: 'or',
        advTip6: '6. Want to learn more? Explore',
        advTip6b: 'and',
        advTip6b: 'and'
    }
};

// App templates
const templates = {
    no: [
        {
            id: 'crm',
            icon: '📇',
            name: 'Mikro CRM Pro',
            desc: '✨ Glassmorphic kontakt-dashboard',
            projectName: 'mikro-crm-pro',
            goal: `En ULTRA moderne CRM med alle finesser:

🎨 VISUELT:
- Glassmorfisme UI med blur-effekter og gradienter
- Glatte scroll-animasjoner og fade-ins
- Partikkel-bakgrunn som reagerer på mus
- Neon-glød ved hover over kort
- Mikro-interaksjoner på alle knapper
- 3D kort-flipping ved klikk
- Animerte gradient-borders

⚡ FUNKSJONER:
- Dra & slipp kontakter mellom statuser (kanban-stil)
- Sanntidssøk med utheving
- Avansert filtrering (multi-select tags, datoperiode)
- Interaktiv tidslinje med scroll-utløste animasjoner
- Smarte påminnelser med nedtellingstimer
- Masse-redigering med checkbox-valg
- Hurtighandlinger ved hover (ring, mail, slett)
- Tastatursnarveier (/, Ctrl+K for søk)

📊 DASHBOARD:
- Animerte statistikk-kort med opptelling
- Mini-grafer for aktivitet (Chart.js eller Canvas)
- Heatmap for kontaktfrekvens
- Tag-sky med størrelse basert på bruk

💾 DATA:
- Auto-lagring med "lagret"-indikator
- Eksporter til JSON/CSV/vCard
- Importer fra CSV med dra-og-slipp
- Angre/Gjør om-funksjonalitet
- localStorage med komprimering`
        },
        {
            id: 'price-tracker',
            icon: '🏷️',
            name: 'Smart Prisjeger',
            desc: '📊 AI-drevet pris-analyse',
            projectName: 'smart-prisjeger',
            goal: `En AVANSERT pris-sporer med AI-krefter:

🤖 SMART TOLKING:
- Lim inn kvitteringstekst → auto-oppdag varer, priser, butikk, dato
- Regex-magi som gjenkjenner norske formater
- Fuzzy matching for lignende varer
- Animert "scanner"-effekt ved tolking
- Framdriftslinje med steg-visualisering

📈 VANVITTIGE GRAFER:
- Interaktive linjediagram med zoom og pan
- Fargekodede butikker (hver butikk = egen farge)
- Hover for eksakte verdier med verktøytips
- Animerte overganger mellom visninger
- Sparklines i hvert vare-kort
- Pris-trend indikatorer (↗️↘️➡️)

🎯 SMARTE VARSLER:
- Sett målpris → få visuell notifikasjon
- "Beste kjøp"-merke på billigste butikk
- Animert konfetti ved ny lavpris
- Prisfall-prosent med fargekoding

✨ UI GODTERI:
- Murstein-rutenett for vare-kort
- Skjelett-lastestatus
- Dra-for-å-oppdatere bevegelse
- Sveip-for-å-slette på mobil
- Filter-chips med animasjon
- Søk med auto-fullføring
- Eksport-knapp med laste-spinner

📊 DASHBOARD:
- Totalt spart over tid (animert teller)
- Mest besøkte butikker (donut-diagram)
- Dyreste/billigste varer (topp 5 lister)
- Månedlig sammenligning (søyle-diagram)`
        },
        {
            id: 'meeting-assistant',
            icon: '📝',
            name: 'AI Møteassistent',
            desc: '🎙️ Live transkribering & smarte notater',
            projectName: 'ai-moteassistent',
            goal: `En NESTE-NIVÅ møte-assistent:

🎙️ LIVE SIMULERING:
- "Tar opp"-indikator med pulserende rød prikk
- Live "transkriberings"-feed (simuler skriveeffekt)
- Bølgeform-visualisering som animerer
- Taler-identifikasjon (forskjellige farger per person)
- Tidsstempler for hvert innlegg

🤖 "AI" FUNKSJONER:
- Auto-oppdag handlingspunkter fra tekst (regex for "må", "skal", frister)
- Sentiment-analyse visualisering (emojis basert på tone)
- Nøkkelord-utvinning med tag-sky
- Auto-generer møtetittel fra innhold
- Smarte forslag til neste møte

⚡ KILLER UI:
- Delt skjerm: Live notater | Handlingspunkter
- Flytende timer med sirkulær fremdrift
- Kanban-tavle for tiltak (Å gjøre/Pågår/Ferdig)
- Dra-og-slipp for re-prioritering
- Fargekodede prioriteter (Høy=rød, Medium=gul, Lav=grønn)
- Tildelte avatarer (generer initialer i sirkel)
- Forfallsdato-velger med kalender-popup

📊 MØTE-INNSIKT:
- Snakketid per person (søyle-diagram)
- Antall handlingspunkter vs fullført
- Gjennomsnittlig møtelengde
- Mest produktiv tid på døgnet (hvis flere møter)

💾 EKSPORT-MAGI:
- Markdown med riktig formatering
- .ics kalender-fil med påminnelser
- PDF med styling (simuler nettleser-print)
- Email-vennlig HTML-mal
- Slack/Teams webhook simulering`
        },
        {
            id: 'learning-game',
            icon: '🎮',
            name: 'GameDev Learning Studio',
            desc: '🕹️ Full game engine for læring',
            projectName: 'gamedev-learning',
            goal: `En KOMPLETT spillmotor for pedagogiske spill:

🎮 SPILLMEKANIKK:
- Flere spillmoduser: Quiz, Hukommelse, Skrive-Race, Matte-Blaster
- Power-up system (2x poeng, sakt tid, hopp over, hint)
- Combo-multiplikatorer ved streak av riktige svar
- Boss-kamper hvert 5. nivå
- Låsbare achievements med notifikasjoner
- XP-system med level-up animasjoner
- Virtuell valuta for å kjøpe hints/power-ups

✨ SPRØ VISUALS:
- Partikkel-eksplosjoner ved riktig svar
- Skjermristing ved feil
- Konfetti-kanon ved fullført nivå
- Helse-bar med puls-animasjon
- Poeng-teller med flyvende tall (+100!)
- Combo-meter med farge-gradient
- Stjernefelt bakgrunn med parallax
- Karakter-avatarer som reagerer (glad/trist/tenker)

🎨 TILPASNING:
- Velg avatar (8+ karakterer med emoji/SVG)
- Fargetemaer (Neon, Retro, Natur, Verdensrom)
- Vanskelighetsgrad (Lett/Middels/Vanskelig/Vanvittig)
- Lydeffekter av/på (syntetiske pip)
- Kontroll av animasjonshastighet

📊 STATISTIKK & PROGRESJON:
- Sanntids ledertavle (topp 10 highscores)
- Detaljert statistikk (nøyaktighet%, gj.snitt tid, beste streak)
- Progresjon ring-diagram per kategori
- Heatmap-kalender for øvelsesdager
- Ferdighets radar-diagram (styrke i forskjellige emner)

🎯 SKAPER-MODUS:
- Visuell spørsmålsbygger med forhåndsvisning
- Masseimport via CSV/JSON
- Randomiser spørsmålsrekkefølge
- Legg til bilder til spørsmål (URL eller emoji)
- Sett tidsgrenser per spørsmål
- Tagg spørsmål etter vanskelighet/kategori
- Eksporter spill som delbar JSON-link`
        },
        {
            id: 'economy-tracker',
            icon: '💰',
            name: 'Finans Dashboard Pro',
            desc: '📸 Kvitterings-skanner & AI-innsikt',
            projectName: 'finans-dashboard-pro',
            goal: `Et PREMIUM økonomiverktøy:

📸 KVITTERINGS-MAGI:
- "Skann kvittering"-knapp med kamera-simulering
- Last opp bilde → vis prosesserings-animasjon
- Trekk ut tekst med regex (beløp, dato, butikk, varer)
- Animert "skanner"-overlegg på bilde
- Konfidenspoeng for hver ekstrahert verdi
- Manuell redigering med inline validering

📊 VANVITTIG DASHBOARD:
- Hero-kort med animerte tellere (totalt brukt, gj.snitt/dag, osv.)
- Donut-diagram for kategorier med hover-detaljer
- Linje-diagram for utgifter over tid (flere linjer for kategorier)
- Søyle-diagram for topp utgifter
- Kalender-heatmap for utgiftsdager
- Framdrifts-ringer for budsjetter med fargekoding
- Trend-indikatorer (↗️ utgifter opp 12%)

💳 BUDSJETT-SYSTEM:
- Sett månedlige budsjetter per kategori
- Visuelle framdriftslinjer med advarselsfarger
- Notifikasjoner når over 80% av budsjett
- Prediktiv "hvis du fortsetter"-kalkulator
- Sparemål-sporer med jubel-animasjon
- Gjentagende utgifts-deteksjon

🎯 SMART INNSIKT:
- "Din største utgift denne måneden: ☕ Kaffe (450kr)"
- "Du brukte 30% mindre på transport vs forrige måned!"
- Foreslåtte budsjett-justeringer
- Finn mønstre ("Du bruker alltid mer på fredager")
- Søppel-detektor (duplikate oppføringer, småkjøp som summerer seg)

✨ PREMIUM UI:
- Glassmorfiske kort på mørk gradient-bakgrunn
- Glatte side-overganger
- Skjelett-lastere for diagrammer
- Filter-skuff som glir inn fra høyre
- Tag-piller med hurtig-filter
- Masse-handlinger (velg flere → masse-kategoriser)
- Sveip-bevegelser på mobil
- Eksport-veiviser med formatvalg

🔐 DATA:
- AES-lignende "krypterings"-simulering
- Backup/gjenopprett funksjonalitet
- Auto-lagring med visuell tilbakemelding
- Data-komprimering for localStorage`
        },
        {
            id: 'task-planner',
            icon: '📋',
            name: 'AI Oppgave-Planlegger Ultra',
            desc: '🤖 Notion-stil produktivitets-suite',
            projectName: 'ai-oppgave-planlegger-ultra',
            goal: `Et NOTION-LIGNENDE produktivitets kraftsenter:

🎯 VISNINGER:
- Kanban-tavle med glatt dra & slipp
- Kalender-visning (måned/uke/dag) med hendelseskort
- Tabell-visning med inline redigering
- Tidslinje/Gantt-diagram for prosjekter
- Liste-visning med gruppering og filtrering
- Bytt visninger med animert overgang

🤖 AI PLANLEGGER:
- "Auto-planlegg uke"-knapp
- Intelligent fordeling av oppgaver basert på prioritet/frist
- Foreslå optimale tider basert på oppgavetype
- Konflikt-deteksjon (overlappende oppgaver)
- Buffer-tid mellom oppgaver
- "Fokus-tid" blokker automatisk

✨ NESTE-NIVÅ OPPGAVER:
- Rik tekst-editor (fet, kursiv, lenker, kode)
- Under-oppgaver med innrykk
- Avhengigheter ("blokkert av" relasjoner)
- Tidssporing med start/stopp timer
- Pomodoro-integrasjon (25/5 min sykluser)
- Tags med auto-fullføring
- Egendefinerte egenskaper (rullegardin, nummer, dato, person)
- Maler for gjentagende oppgaver
- Hurtig-legg til med naturlig språk ("møte onsdag kl 14")

📊 DASHBOARDS:
- Personlig dashboard med dagens oppgaver
- Uke-oversikt med arbeidsmengde-fordeling
- Vane-sporer med streak-teller
- Tid brukt per prosjekt (kakediagram)
- Produktivitets-poeng med trend
- Nedbrytnings-diagram for sprinter

🎨 TILPASNING:
- Flere arbeidsområder (Jobb, Personlig, Skole)
- Egendefinerte temaer med fargevelgere
- Ikon-bibliotek for prosjekter (emoji + ikoner)
- Forsidebilder for prosjektsider
- Sidebar favoritter med dra-omorganiser

⚡ KRAFT-FUNKSJONER:
- Tastatursnarveier (/, ⌘K for hurtighandlinger)
- Skråstrek-kommandoer for formatering
- @-nevninger for tildelte
- Forfallsdato påminnelser med nettleser-notifikasjoner
- Gjentagende oppgaver (daglig, ukentlig, egendefinert)
- Arkiver fullførte oppgaver
- Masse-operasjoner (multi-valg)
- Global søk med fuzzy matching

💾 EKSPORT:
- PDF med egendefinert styling
- Markdown med avkrysningsbokser
- CSV/Excel for data-analyse
- iCal for kalender-synkronisering
- JSON for backup`
        },
        {
            id: 'scratch',
            icon: '✨',
            name: 'Start fra scratch',
            desc: 'Skriv din egen beskrivelse',
            projectName: '',
            goal: ''
        }
    ],
    en: [
        {
            id: 'crm',
            icon: '📇',
            name: 'Micro CRM Pro',
            desc: '✨ Glassmorphic contact dashboard',
            projectName: 'micro-crm-pro',
            goal: `An ULTRA modern CRM with all bells & whistles:

🎨 VISUALS:
- Glassmorphism UI with blur effects and gradients
- Smooth scroll animations and fade-ins
- Particle background that reacts to mouse
- Neon-glow on card hover
- Micro-interactions on all buttons
- 3D card flips on click
- Animated gradient borders

⚡ FEATURES:
- Drag & drop contacts between statuses (kanban-style)
- Real-time search with highlighting
- Advanced filtering (multi-select tags, daterange)
- Interactive timeline with scroll-triggered animations
- Smart reminders with countdown timer
- Bulk-edit with checkbox selection
- Quick-actions on hover (call, email, delete)
- Keyboard shortcuts (/, Ctrl+K for search)

📊 DASHBOARD:
- Animated statistics cards with count-up
- Mini-graphs for activity (Chart.js or Canvas)
- Heatmap for contact frequency
- Tag-cloud with size based on usage

💾 DATA:
- Auto-save with "saved" indicator
- Export to JSON/CSV/vCard
- Import from CSV with drag-drop
- Undo/Redo functionality
- localStorage with compression`
        },
        {
            id: 'price-tracker',
            icon: '🏷️',
            name: 'Smart Price Tracker',
            desc: '📊 AI-powered price analysis',
            projectName: 'smart-price-tracker',
            goal: `An ADVANCED price tracker with AI vibes:

🤖 SMART PARSING:
- Paste receipt text → auto-detect items, prices, store, date
- Regex magic for format recognition
- Fuzzy matching for similar items
- Animated "scanning" effect during parsing
- Progress bar with steps visualization

📈 INSANE CHARTS:
- Interactive line charts with zoom and pan
- Color-coded stores (each store = unique color)
- Hover for exact values with tooltip
- Animated transitions between views
- Sparklines in each item card
- Price trend indicators (↗️↘️➡️)

🎯 SMART ALERTS:
- Set target price → get visual notification
- "Best deal" badge on cheapest store
- Animated confetti on new low price
- Price drop percentage with color coding

✨ UI CANDY:
- Masonry grid layout for item cards
- Skeleton loading states
- Pull-to-refresh gesture
- Swipe-to-delete on mobile
- Filter chips with animation
- Search with autocomplete
- Export button with loading spinner

📊 DASHBOARD:
- Total saved over time (animated counter)
- Most visited stores (donut chart)
- Most/least expensive items (top 5 lists)
- Monthly comparison (bar chart)`
        },
        {
            id: 'meeting-assistant',
            icon: '📝',
            name: 'AI Meeting Assistant',
            desc: '🎙️ Live transcription & smart notes',
            projectName: 'ai-meeting-assistant',
            goal: `A NEXT-LEVEL meeting assistant:

🎙️ LIVE SIMULATION:
- "Recording" indicator with pulsating red dot
- Live "transcription" feed (simulate typing effect)
- Waveform visualization that animates
- Speaker diarization (different colors per person)
- Timestamps for each entry

🤖 "AI" FEATURES:
- Auto-detect action items from text (regex for tasks, deadlines)
- Sentiment analysis visualization (emojis based on tone)
- Keyword extraction with tag-cloud
- Auto-generate meeting title from content
- Smart suggestions for next meeting

⚡ KILLER UI:
- Split-screen: Live notes | Action items
- Floating timer with circular progress
- Kanban board for tasks (Todo/Doing/Done)
- Drag-drop for re-prioritization
- Color-coded priority (High=red, Medium=yellow, Low=green)
- Assignee avatars (generate initials in circle)
- Due date picker with calendar popup

📊 MEETING INSIGHTS:
- Talk time per person (bar chart)
- Action items vs completed ratio
- Average meeting length
- Most productive time of day (if multiple meetings)

💾 EXPORT MAGIC:
- Markdown with proper formatting
- .ics calendar file with reminders
- PDF with styling (simulate browser print)
- Email-friendly HTML template
- Slack/Teams webhook simulation`
        },
        {
            id: 'learning-game',
            icon: '🎮',
            name: 'GameDev Learning Studio',
            desc: '🕹️ Full game engine for learning',
            projectName: 'gamedev-learning',
            goal: `A COMPLETE game engine for educational games:

🎮 GAME MECHANICS:
- Multiple game modes: Quiz, Memory, Typing Race, Math Blaster
- Power-ups system (2x points, slow time, skip, hint)
- Combo multipliers on answer streaks
- Boss battles every 5 levels
- Unlockable achievements with notifications
- XP system with level-up animations
- Virtual currency to buy hints/power-ups

✨ INSANE VISUALS:
- Particle explosions on correct answer
- Screen shake on wrong answer
- Confetti cannon on level complete
- Health bar with pulse animation
- Score counter with flying numbers (+100!)
- Combo meter with color gradient
- Starfield background with parallax
- Character avatars that react (happy/sad/thinking)

🎨 CUSTOMIZATION:
- Choose avatar (8+ characters with emoji/SVG)
- Color themes (Neon, Retro, Nature, Space)
- Difficulty slider (Easy/Medium/Hard/Insane)
- Sound effects toggle (synthesized bleeps)
- Animation speed control

📊 STATS & PROGRESS:
- Real-time leaderboard (top 10 highscores)
- Detailed stats (accuracy%, avg time, best streak)
- Progress ring chart per category
- Heatmap calendar for practice days
- Skill radar chart (different topic strengths)

🎯 CREATOR MODE:
- Visual question builder with preview
- Bulk import via CSV/JSON
- Randomize question order
- Add images to questions (URL or emoji)
- Set time limits per question
- Tag questions by difficulty/category
- Export game as shareable JSON link`
        },
        {
            id: 'economy-tracker',
            icon: '💰',
            name: 'Finance Dashboard Pro',
            desc: '📸 Receipt scanner & AI insights',
            projectName: 'finance-dashboard-pro',
            goal: `A PREMIUM finance tool:

📸 RECEIPT MAGIC:
- "Scan receipt" button with camera simulation
- Upload image → show processing animation
- Extract text with regex (amounts, dates, stores, items)
- Animated "scanning" overlay on image
- Confidence score for each extracted value
- Manual edit with inline validation

📊 INSANE DASHBOARD:
- Hero cards with animated counters (total spent, avg/day, etc.)
- Donut chart for categories with hover details
- Line chart for spending over time (multi-line for categories)
- Bar chart for top expenses
- Calendar heatmap for spending days
- Progress rings for budgets with color coding
- Trend indicators (↗️ spending up 12%)

💳 BUDGET SYSTEM:
- Set monthly budgets per category
- Visual progress bars with warning colors
- Notifications when over 80% of budget
- Predictive "if you continue" calculator
- Savings goal tracker with celebration animation
- Recurring expense detection

🎯 SMART INSIGHTS:
- "Your biggest expense this month: ☕ Coffee ($45)"
- "You spent 30% less on transport vs last month!"
- Suggested budget adjustments
- Find patterns ("You always spend more on Fridays")
- Waste detector (duplicate entries, small purchases that add up)

✨ PREMIUM UI:
- Glassmorphic cards on dark gradient background
- Smooth page transitions
- Skeleton loaders for charts
- Filter drawer that slides in from right
- Tag pills with quick-filter
- Batch actions (select multiple → bulk categorize)
- Swipe gestures on mobile
- Export wizard with format selection

🔐 DATA:
- AES-like "encryption" simulation
- Backup/restore functionality
- Auto-save with visual feedback
- Data compression for localStorage`
        },
        {
            id: 'task-planner',
            icon: '📋',
            name: 'AI Task Planner Ultra',
            desc: '🤖 Notion-style productivity suite',
            projectName: 'ai-task-planner-ultra',
            goal: `A NOTION-LIKE productivity powerhouse:

🎯 VIEWS:
- Kanban board with smooth drag & drop
- Calendar view (month/week/day) with event cards
- Table view with inline editing
- Timeline/Gantt chart for projects
- List view with grouping and filtering
- Switch views with animated transition

🤖 AI SCHEDULER:
- "Auto-schedule week" button
- Intelligently distribute tasks based on priority/deadline
- Suggest optimal times based on task type
- Conflict detection (overlapping tasks)
- Buffer time between tasks
- "Focus time" blocks automatically

✨ NEXT-LEVEL TASKS:
- Rich text editor (bold, italic, links, code)
- Sub-tasks with indentation
- Dependencies ("blocked by" relationships)
- Time tracking with start/stop timer
- Pomodoro integration (25/5 min cycles)
- Tags with auto-complete
- Custom properties (dropdown, number, date, person)
- Templates for recurring tasks
- Quick-add with natural language ("meeting Wednesday 2pm")

📊 DASHBOARDS:
- Personal dashboard with today's tasks
- Week overview with workload distribution
- Habit tracker with streak counter
- Time spent per project (pie chart)
- Productivity score with trend
- Burndown chart for sprints

🎨 CUSTOMIZATION:
- Multiple workspaces (Work, Personal, School)
- Custom themes with color pickers
- Icon library for projects (emoji + icons)
- Cover images for project pages
- Sidebar favorites with drag-reorder

⚡ POWER FEATURES:
- Keyboard shortcuts (/, ⌘K for quick actions)
- Slash commands for formatting
- @mentions for assignees
- Due date reminders with browser notifications
- Recurring tasks (daily, weekly, custom)
- Archive completed tasks
- Batch operations (multi-select)
- Global search with fuzzy matching

💾 EXPORT:
- PDF with custom styling
- Markdown with checkboxes
- CSV/Excel for data analysis
- iCal for calendar sync
- JSON for backup`
        },
        {
            id: 'scratch',
            icon: '✨',
            name: 'Start from scratch',
            desc: 'Write your own description',
            projectName: '',
            goal: ''
        }
    ]
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
    $('hTemplates').textContent = t.hTemplates;
    $('tDetails').textContent = t.tDetails;
    $('lName').textContent = t.lName;
    $('lGoal').textContent = t.lGoal;
    $('lStack').textContent = t.lStack;
    $('hStack').textContent = t.hStack;
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
    $('btnPromptHelper').textContent = t.promptHelper;
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
    setOpt('stack', 'pwa', t.optStackPwa);
    setOpt('stack', 'custom', t.optStackCustom);

    // Update optgroup labels
    const stackOptgroups = $('stack').querySelectorAll('optgroup');
    if (stackOptgroups[0]) stackOptgroups[0].label = t.optGroupBeginner;
    if (stackOptgroups[1]) stackOptgroups[1].label = t.optGroupAdvanced;
    if (stackOptgroups[2]) stackOptgroups[2].label = t.optGroupOther;

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
    $('tipPromptHelperTitle').textContent = t.tipPromptHelperTitle;
    $('tipPromptHelperDesc').textContent = t.tipPromptHelperDesc;
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
    
    const outputEl = $('output');

    const t = i18n[state.uiLang];
    if (parsed && parsed.index_html) {
        outputEl.textContent = parsed.index_html;
        outputEl.classList.remove('empty');

        // Update state
        state.last.hasIndex = true;
        state.last.fileCount = parsed.files ? parsed.files.length : 0;

        updateMetaDisplay();
        enableOutputActions(true);
        return;
    }

    outputEl.textContent = state.last.raw;
    
    // Add or remove 'empty' class based on content
    if (state.last.raw.trim()) {
        outputEl.classList.remove('empty');
    } else {
        outputEl.classList.add('empty');
    }

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
    const outLang = 'no'; // Always Norwegian for now
    const wantsMulti = false; // Always single file for simplicity

    // Get stack value (handle custom option)
    let stackValue = $('stack').value;
    if (stackValue === 'custom') {
        stackValue = $('stackCustom').value.trim() || 'html-css-js';
    }

    const spec = {
        project_name: $('projectName').value.trim(),
        goal: $('goal').value.trim(),
        stack: stackValue,
        output_language: outLang,
        output_mode: 'single'
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
    const temp = 0.7; // Fixed temperature for consistency

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

    // Simulate progress during AI generation
    let currentProgress = 10;
    let progressInterval = null;

    try {
        updateProgress(25, state.uiLang === 'no' ? '📤 Sender forespørsel...' : '📤 Sending request...');
        currentProgress = 25;
        
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
        currentProgress = 50;
        
        // Gradually increment progress while waiting for response
        progressInterval = setInterval(() => {
            if (currentProgress < 70) {
                currentProgress += 1;
                updateProgress(currentProgress, state.uiLang === 'no' ? '⚡ AI genererer kode...' : '⚡ AI generating code...');
            }
        }, 300);

        if (!res.ok) {
            if (progressInterval) clearInterval(progressInterval);
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

        // Stop the progress simulation
        if (progressInterval) clearInterval(progressInterval);
        
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
        if (progressInterval) clearInterval(progressInterval);
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
    // Since we removed Next.js, Vue, Svelte - this simplifies to never needing Node
    const needsNodeSetup = false;
    
    const needsServer = stack.includes('python') || stack.includes('nodejs');
    
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

### Trinn 3: Rediger koden
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
    
    // Clear output completely - both textContent and innerHTML
    const outputEl = $('output');
    outputEl.textContent = '';
    outputEl.innerHTML = '';
    outputEl.classList.add('empty');
    
    // Reset state
    state.last.raw = '';
    state.last.parsed = null;
    state.last.hasIndex = false;
    state.last.fileCount = 0;
    
    // Update meta display and disable actions
    updateMetaDisplay();
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

// Prompt Helper Modal
function showPromptHelper() {
    const t = i18n[state.uiLang];
    
    const overlay = document.createElement('div');
    overlay.className = 'preview-overlay';
    overlay.style.zIndex = '10000';
    
    overlay.innerHTML = `
        <div class="preview-modal" style="max-width:700px;max-height:90vh;overflow-y:auto">
            <div class="preview-header">
                <h2 class="preview-title">${t.promptHelperTitle}</h2>
                <button class="preview-close" id="promptClose">✕</button>
            </div>
            <div style="padding:24px">
                <p style="margin-bottom:24px;color:var(--text2)">${t.promptHelperDesc}</p>
                
                <div class="prompt-wizard">
                    <div class="form-group" style="margin-bottom:20px">
                        <label style="display:block;margin-bottom:8px;font-weight:500">${t.promptQ1}</label>
                        <input type="text" id="promptAppType" placeholder="${t.promptQ1Placeholder}" 
                               style="width:100%;padding:10px;border:1px solid var(--panel-border);border-radius:8px;background:var(--panel);color:var(--text)">
                    </div>
                    
                    <div class="form-group" style="margin-bottom:20px">
                        <label style="display:block;margin-bottom:8px;font-weight:500">${t.promptQ2}</label>
                        <input type="text" id="promptAudience" placeholder="${t.promptQ2Placeholder}"
                               style="width:100%;padding:10px;border:1px solid var(--panel-border);border-radius:8px;background:var(--panel);color:var(--text)">
                    </div>
                    
                    <div class="form-group" style="margin-bottom:20px">
                        <label style="display:block;margin-bottom:8px;font-weight:500">${t.promptQ3}</label>
                        <textarea id="promptMainFeature" rows="3" placeholder="${t.promptQ3Placeholder}"
                                  style="width:100%;padding:10px;border:1px solid var(--panel-border);border-radius:8px;background:var(--panel);color:var(--text);resize:vertical"></textarea>
                    </div>
                    
                    <div class="form-group" style="margin-bottom:20px">
                        <label style="display:block;margin-bottom:8px;font-weight:500">${t.promptQ4}</label>
                        <textarea id="promptData" rows="2" placeholder="${t.promptQ4Placeholder}"
                                  style="width:100%;padding:10px;border:1px solid var(--panel-border);border-radius:8px;background:var(--panel);color:var(--text);resize:vertical"></textarea>
                    </div>
                    
                    <div class="form-group" style="margin-bottom:20px">
                        <label style="display:block;margin-bottom:8px;font-weight:500">${t.promptQ5}</label>
                        <textarea id="promptInteractions" rows="2" placeholder="${t.promptQ5Placeholder}"
                                  style="width:100%;padding:10px;border:1px solid var(--panel-border);border-radius:8px;background:var(--panel);color:var(--text);resize:vertical"></textarea>
                    </div>
                    
                    <div class="form-group" style="margin-bottom:20px">
                        <label style="display:block;margin-bottom:8px;font-weight:500">${t.promptQ6}</label>
                        <select id="promptStyle" style="width:100%;padding:10px;border:1px solid var(--panel-border);border-radius:8px;background:var(--panel);color:var(--text)">
                            ${t.promptQ6Options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group" style="margin-bottom:20px">
                        <label style="display:block;margin-bottom:8px;font-weight:500">${t.promptQ7}</label>
                        <textarea id="promptOther" rows="2" placeholder="${t.promptQ7Placeholder}"
                                  style="width:100%;padding:10px;border:1px solid var(--panel-border);border-radius:8px;background:var(--panel);color:var(--text);resize:vertical"></textarea>
                    </div>
                </div>
                
                <div style="display:flex;gap:12px;margin-top:24px">
                    <button class="primary" id="promptGenerateBtn" style="flex:1">${t.promptGenerate}</button>
                    <button class="secondary" id="promptCancelBtn">${t.promptCancel}</button>
                </div>
                
                <div id="promptResult" class="hidden" style="margin-top:24px;padding:16px;background:var(--panel);border:1px solid var(--panel-border);border-radius:12px">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                        <strong style="color:var(--primary)">✨ ${state.uiLang === 'no' ? 'Din Premium Prompt' : 'Your Premium Prompt'}:</strong>
                        <button class="primary" id="promptInsertBtn" style="padding:6px 16px;font-size:13px">${t.promptInsert}</button>
                    </div>
                    <pre id="promptText" style="white-space:pre-wrap;color:var(--text2);font-size:14px;line-height:1.6;max-height:400px;overflow-y:auto"></pre>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Event handlers
    const generateBtn = overlay.querySelector('#promptGenerateBtn');
    const insertBtn = overlay.querySelector('#promptInsertBtn');
    const cancelBtn = overlay.querySelector('#promptCancelBtn');
    const closeBtn = overlay.querySelector('#promptClose');
    const resultDiv = overlay.querySelector('#promptResult');
    const promptText = overlay.querySelector('#promptText');
    
    generateBtn.addEventListener('click', () => {
        const appType = overlay.querySelector('#promptAppType').value.trim();
        const audience = overlay.querySelector('#promptAudience').value.trim();
        const mainFeature = overlay.querySelector('#promptMainFeature').value.trim();
        const data = overlay.querySelector('#promptData').value.trim();
        const interactions = overlay.querySelector('#promptInteractions').value.trim();
        const style = overlay.querySelector('#promptStyle').value;
        const other = overlay.querySelector('#promptOther').value.trim();
        
        if (!appType || !mainFeature) {
            alert(state.uiLang === 'no' ? 'Fyll ut minst spørsmål 1 og 3' : 'Fill out at least questions 1 and 3');
            return;
        }
        
        // Build PREMIUM structured prompt with ALL bells and whistles
        let prompt = state.uiLang === 'no' 
            ? `Lag en PREMIUM ${appType}` 
            : `Create a PREMIUM ${appType}`;
        
        if (audience) prompt += ` for ${audience}`;
        prompt += state.uiLang === 'no' 
            ? ' med ALL BELLS & WHISTLES!\n\n'
            : ' with ALL BELLS & WHISTLES!\n\n';
        
        prompt += state.uiLang === 'no' ? '🎯 HOVEDFUNKSJON:\n' : '🎯 MAIN FUNCTION:\n';
        prompt += mainFeature + '\n\n';
        
        if (data) {
            prompt += state.uiLang === 'no' ? '💾 DATA & LAGRING:\n' : '💾 DATA & STORAGE:\n';
            prompt += data + '\n';
            prompt += state.uiLang === 'no' 
                ? '- Bruk localStorage for å lagre data persistent\n'
                : '- Use localStorage to store data persistently\n';
            prompt += state.uiLang === 'no'
                ? '- Legg til eksport/import funksjonalitet (JSON)\n\n'
                : '- Add export/import functionality (JSON)\n\n';
        }
        
        if (interactions) {
            prompt += state.uiLang === 'no' ? '⚡ INTERAKSJONER:\n' : '⚡ INTERACTIONS:\n';
            prompt += interactions + '\n\n';
        }
        
        prompt += state.uiLang === 'no' ? '🎨 DESIGN & UI/UX:\n' : '🎨 DESIGN & UI/UX:\n';
        prompt += `${style}\n`;
        prompt += state.uiLang === 'no'
            ? `- Glassmorphism effekter med backdrop-filter blur
- Gradient borders og shadows
- Smooth animasjoner (fade-in, slide, scale, etc)
- Hover effekter på alle interaktive elementer
- Micro-interactions (button press, loading states)
- Animated gradient backgrounds
- Card-based layout med shadows og hover lift
- Smooth transitions mellom states (0.3s ease)
- Loading skeletons/spinners
- Progress bars/indicators
- Toast notifications for feedback
- Emoji/ikoner for visuell appeal

`
            : `- Glassmorphism effects with backdrop-filter blur
- Gradient borders and shadows
- Smooth animations (fade-in, slide, scale, etc)
- Hover effects on all interactive elements
- Micro-interactions (button press, loading states)
- Animated gradient backgrounds
- Card-based layout with shadows and hover lift
- Smooth transitions between states (0.3s ease)
- Loading skeletons/spinners
- Progress bars/indicators
- Toast notifications for feedback
- Emoji/icons for visual appeal

`;
        
        prompt += state.uiLang === 'no' ? '✨ PREMIUM FUNKSJONER:\n' : '✨ PREMIUM FEATURES:\n';
        prompt += state.uiLang === 'no'
            ? `- Dark/Light mode toggle med smooth transition
- Responsive design (mobil, tablet, desktop)
- Keyboard shortcuts
- Drag & drop funksjonalitet (hvis relevant)
- Search/filter funksjonalitet
- Sort funksjonalitet
- Undo/Redo (hvis relevant)
- Auto-save funksjonalitet
- Konfetti/celebration animasjoner ved suksess
- Sound effects (synthesized med Web Audio API)
- Particle effects
- Error handling med user-friendly meldinger

`
            : `- Dark/Light mode toggle with smooth transition
- Responsive design (mobile, tablet, desktop)
- Keyboard shortcuts
- Drag & drop functionality (if relevant)
- Search/filter functionality
- Sort functionality
- Undo/Redo (if relevant)
- Auto-save functionality
- Confetti/celebration animations on success
- Sound effects (synthesized with Web Audio API)
- Particle effects
- Error handling with user-friendly messages

`;
        
        if (other) {
            prompt += state.uiLang === 'no' ? '🔧 ANDRE KRAV:\n' : '🔧 OTHER REQUIREMENTS:\n';
            prompt += other + '\n\n';
        }
        
        prompt += state.uiLang === 'no' ? '📋 TEKNISKE KRAV:\n' : '📋 TECHNICAL REQUIREMENTS:\n';
        prompt += state.uiLang === 'no'
            ? `- Semantisk HTML5
- Mobilvennlig responsive design (mobile-first)
- Tilgjengelighet (ARIA labels, keyboard navigation, god kontrast)
- Performance (optimaliserte animasjoner, lazy loading)
- Ren, organisert CSS (CSS Variables for farger/spacing)
- Vanilla JavaScript (ingen dependencies)
- Kommentarer for kompleks logikk
- All funksjonalitet uten backend (client-side only)
- localStorage for persistent data
- Error boundaries og graceful degradation

🚀 GÅ ALL IN! Lag noe som ser ut som det koster 10 000 kr i design!`
            : `- Semantic HTML5
- Mobile-friendly responsive design (mobile-first)
- Accessibility (ARIA labels, keyboard navigation, good contrast)
- Performance (optimized animations, lazy loading)
- Clean, organized CSS (CSS Variables for colors/spacing)
- Vanilla JavaScript (no dependencies)
- Comments for complex logic
- All functionality without backend (client-side only)
- localStorage for persistent data
- Error boundaries and graceful degradation

🚀 GO ALL IN! Make something that looks like it cost $10,000 in design!`;
        
        promptText.textContent = prompt;
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    
    insertBtn.addEventListener('click', () => {
        const prompt = promptText.textContent;
        $('goal').value = prompt;
        overlay.remove();
    });
    
    const closeModal = () => overlay.remove();
    cancelBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escHandler);
        }
    });
}

$('btnPromptHelper').addEventListener('click', showPromptHelper);

$('btnCopy').addEventListener('click', copyOutput);
$('btnDownload').addEventListener('click', downloadIndex);
$('btnDownloadAll').addEventListener('click', downloadAllFiles);
$('btnPreview').addEventListener('click', openPreview);
$('btnShowFiles').addEventListener('click', showFiles);
$('btnClear').addEventListener('click', () => {
    clearAll();
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
    // With simplified options, no stacks need warnings since React uses ESM and PWA is straightforward
    const complexStacks = [];
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

// Initialize app
loadRememberedKey();
applyLang();
clearAll();
setApiState();
