const $ = (id) => document.getElementById(id);

// ============================================
// SECURITY: API KEY OBFUSCATION
// ============================================
// NOTE: This is NOT encryption - it's obfuscation to prevent casual viewing.
// localStorage is inherently insecure. Users should be warned about risks.
const STORAGE_KEY = 'vibe_idea_builder_api_key_v2';
const OBFUSCATION_KEY = 'vibe-secure-2024'; // Simple obfuscation, not real security

function obfuscateKey(plainKey) {
    if (!plainKey) return '';
    const keyChars = OBFUSCATION_KEY.split('');
    return btoa(plainKey.split('').map((char, i) =>
        String.fromCharCode(char.charCodeAt(0) ^ keyChars[i % keyChars.length].charCodeAt(0))
    ).join(''));
}

function deobfuscateKey(obfuscatedKey) {
    if (!obfuscatedKey) return '';
    try {
        const decoded = atob(obfuscatedKey);
        const keyChars = OBFUSCATION_KEY.split('');
        return decoded.split('').map((char, i) =>
            String.fromCharCode(char.charCodeAt(0) ^ keyChars[i % keyChars.length].charCodeAt(0))
        ).join('');
    } catch {
        return '';
    }
}

// Security: Sanitize HTML to prevent XSS
function sanitizeHtml(html) {
    // Create a temporary element to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Remove dangerous elements
    const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'meta', 'link', 'base'];
    dangerousTags.forEach(tag => {
        temp.querySelectorAll(tag).forEach(el => el.remove());
    });

    // Remove dangerous attributes
    const dangerousAttrs = ['onclick', 'onerror', 'onload', 'onmouseover', 'onfocus', 'onblur',
                           'onsubmit', 'onreset', 'onkeydown', 'onkeyup', 'onkeypress'];
    temp.querySelectorAll('*').forEach(el => {
        dangerousAttrs.forEach(attr => el.removeAttribute(attr));
        // Remove javascript: URLs
        if (el.href && el.href.toLowerCase().startsWith('javascript:')) {
            el.removeAttribute('href');
        }
        if (el.src && el.src.toLowerCase().startsWith('javascript:')) {
            el.removeAttribute('src');
        }
    });

    return temp.innerHTML;
}

// Security: Safe error logging without exposing API keys
function safeLogError(context, error) {
    const sanitizedError = String(error)
        .replace(/sk-[a-zA-Z0-9_-]+/g, 'sk-***REDACTED***')
        .replace(/sk-ant-[a-zA-Z0-9_-]+/g, 'sk-ant-***REDACTED***')
        .replace(/AIza[a-zA-Z0-9_-]+/g, 'AIza***REDACTED***');
    console.error(context, sanitizedError);
}

const state = {
    uiLang: 'no',
    currentStep: 1,
    apiValidated: false,
    selectedProvider: 'google',
    last: {
        raw: '',
        parsed: null,
        fileCount: 0,
        hasIndex: false
    }
};

const providerConfig = {
    google: {
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
        prefix: 'AIza',
        models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-3-flash-preview', 'gemini-3-pro-preview']
    },
    openai: {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        prefix: 'sk-',
        models: ['gpt-4.1', 'gpt-5-mini', 'gpt-5.2', 'gpt-5.2-pro', 'gpt-5-nano']
    },
    anthropic: {
        endpoint: 'https://api.anthropic.com/v1/messages',
        prefix: 'sk-ant-',
        models: ['claude-sonnet-4-5-20250514', 'claude-opus-4-5-20250514', 'claude-haiku-4-5-20251001']
    }
};

// Helper: Get endpoint for a model (derives from provider config to avoid duplication)
function getEndpointForModel(model) {
    // Check each provider's models
    for (const [provider, config] of Object.entries(providerConfig)) {
        if (config.models.includes(model)) {
            return config.endpoint;
        }
    }
    // Special case: local model
    if (model === 'local-model') {
        return 'http://localhost:1234/v1/chat/completions';
    }
    // Fallback to current endpoint field value
    return $('endpoint').value;
}

// Helper: Detect if using Anthropic API
function isAnthropicEndpoint(endpoint) {
    return endpoint.includes('api.anthropic.com');
}

// Helper: Make API call with correct format for provider
async function makeApiCall(endpoint, apiKey, model, systemPrompt, userPrompt, temperature = 0.7, maxTokens = 16000) {
    if (isAnthropicEndpoint(endpoint)) {
        // Anthropic format
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model,
                max_tokens: maxTokens,
                system: systemPrompt,
                messages: [
                    { role: 'user', content: userPrompt }
                ]
            })
        });
        return res;
    } else {
        // OpenAI-compatible format (OpenAI, Google, etc.)
        const isOpenAI = endpoint.includes('openai.com');
        // Reasoning models (o-series) don't support temperature
        const isReasoningModel = /^o[134]/.test(model);

        const requestBody = {
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]
        };

        // Add temperature only for non-reasoning models
        if (!isReasoningModel) {
            requestBody.temperature = temperature;
        }

        // OpenAI uses max_completion_tokens, others use max_tokens
        if (isOpenAI) {
            requestBody.max_completion_tokens = maxTokens;
        } else {
            requestBody.max_tokens = maxTokens;
        }

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });
        return res;
    }
}

// Helper: Extract content from API response
function extractContent(json, endpoint) {
    if (isAnthropicEndpoint(endpoint)) {
        // Anthropic response format
        return json?.content?.[0]?.text;
    } else {
        // OpenAI-compatible response format
        return json?.choices?.[0]?.message?.content;
    }
}

const i18n = {
    no: {
        heroBadge: '✨ AI-drevet kodegenerator',
        heroTitle: 'Bygg apper<br><span class="gradient-text">uten å kode</span>',
        heroSubtitle: 'Beskriv idéen din, velg teknologi, og få startklar kode på sekunder. Perfekt for nybegynnere og raske prototyper.',
        heroFeature1: 'Klar på sekunder',
        heroFeature2: 'Én fil, fungerer overalt',
        heroFeature3: 'Din nøkkel, ditt innhold',
        generator: 'Generator',
        help: 'Hjelp',
        about: 'Om',
        wizardStep1: 'API-nøkkel',
        wizardStep2: 'Beskriv appen',
        wizardStep3: 'Generer',
        step1Title: 'Koble til AI',
        step1Desc: 'Legg inn API-nøkkelen din for å komme i gang',
        step2Title: 'Beskriv drømmeappen din',
        step2Desc: 'Svar på spørsmålene under for å lage en detaljert beskrivelse. Jo mer du forteller, jo bedre blir resultatet!',
        step3Title: 'Din app er klar!',
        step3Desc: 'Resultatet vises nedenfor. Du kan forhåndsvise, laste ned eller kopiere koden.',
        continueBtn: 'Fortsett til neste steg',
        backBtn: 'Tilbake',
        generateBtn: '🚀 Generer app',
        regenerateBtn: '🔄 Generer på nytt',
        startOverBtn: '🔁 Start på nytt',
        validating: 'Validerer nøkkel...',
        validSuccess: 'Nøkkel validert! Klar til å fortsette.',
        validError: 'Ugyldig nøkkel. Sjekk at du har kopiert hele nøkkelen.',
        securityTitle: 'Din nøkkel er trygg',
        securityDesc: 'API-nøkkelen sendes direkte fra din nettleser til valgt leverandør. Den lagres aldri på våre servere – alt skjer lokalt hos deg.',
        promptQ1: 'Hva slags app vil du lage?',
        promptQ2: 'Hvem er målgruppen?',
        promptQ3: 'Beskriv hovedfunksjonen i detalj',
        promptQ4: 'Hvilke data skal lagres/vises?',
        promptQ5: 'Interaksjoner - hva skal skje?',
        promptQ6: 'Hvilket design/stemning?',
        promptQ7: 'Spesielle ønsker?',
        promptRequired: 'Fyll ut minst spørsmål 1 og 3',
        aiImproveTitle: 'AI-assistert forbedring',
        aiImproveDesc: 'La AI-en forbedre og utvide beskrivelsen din med profesjonelle detaljer',
        aiImproving: 'AI forbedrer beskrivelsen din...',
        promptPreviewTitle: '📝 Din prompt',
        showPreview: 'Vis forhåndsvisning',
        hidePreview: 'Skjul forhåndsvisning',
        statusReady: 'klar',
        statusNeedKey: 'mangler API-nøkkel',
        statusCalling: 'kaller modell',
        statusDone: 'ferdig',
        statusFail: 'feil',
        statusNotConfigured: 'ikke konfigurert',
        statusConfigured: 'konfigurert',
        outNone: 'ingen',
        output: 'Resultat',
        preview: '👁️ Forhåndsvis',
        copy: '📋 Kopier',
        download: '💾 Last ned',
        downloadZip: '📦 Last ned ZIP',
        showFiles: '📂 Vis filer',
        projectTips: '💡 Prosjekt-tips',
        noteKey: 'Tips: legg aldri API-nøkkel i generert kode',
        refineTitle: 'Ikke helt fornøyd?',
        refineDesc: 'Beskriv hva du vil endre eller forbedre',
        refinePlaceholder: "F.eks. 'Gjør knappene større', 'Legg til en footer', 'Endre fargetema til blått', 'Fiks buggen med...'",
        refineBtn: '🔄 Forbedre koden',
        refineLoading: 'AI forbedrer koden din...',
        // Provider instructions
        providerGoogleTitle: '🚀 Slik får du Google API-nøkkel:',
        providerGoogleStep1: 'Gå til',
        providerGoogleStep2: 'Logg inn med Google-kontoen din',
        providerGoogleStep3: 'Klikk "Create API Key"',
        providerGoogleStep4: 'Kopier nøkkelen (starter med',
        providerOpenAITitle: '🔐 Slik får du OpenAI API-nøkkel:',
        providerOpenAIStep1: 'Gå til',
        providerOpenAIStep2: 'Opprett konto eller logg inn',
        providerOpenAIStep3: 'Klikk "Create new secret key"',
        providerOpenAIStep4: 'Kopier nøkkelen (starter med',
        providerAnthropicTitle: '🟣 Slik får du Anthropic API-nøkkel:',
        providerAnthropicStep1: 'Gå til',
        providerAnthropicStep2: 'Opprett konto eller logg inn',
        providerAnthropicStep3: 'Klikk "Create Key"',
        providerAnthropicStep4: 'Kopier nøkkelen (starter med',
        // Labels and placeholders
        apiKeyLabel: 'API-nøkkel',
        apiKeyPlaceholder: 'Lim inn din API-nøkkel her...',
        advancedSettings: '⚙️ Avanserte innstillinger',
        endpointLabel: 'API-endepunkt',
        modelLabel: 'Modell',
        rememberKeyLabel: 'Lagre nøkkel',
        rememberNo: 'Ikke lagre (anbefalt)',
        rememberLocal: 'Lagre lokalt i nettleser',
        rememberHint: '⚠️ Lagring anbefales ikke på delte maskiner',
        technologyLabel: 'Teknologi',
        techHtmlCssJs: 'Ren HTML/CSS/JS (anbefalt)',
        techTailwind: 'HTML + Tailwind CSS',
        techReact: 'React (ESM - ingen npm)',
        techCustom: 'Egendefinert...',
        techCustomPlaceholder: 'Skriv inn teknologi...',
        // Model groups
        modelGeminiGroup: 'Google Gemini (Anbefalt)',
        modelGeminiFast: 'Rask',
        modelGeminiPowerful: 'Kraftig',
        modelGeminiNewest: 'Nyeste',
        modelGeminiBest: 'Beste',
        modelOpenAIGroup: 'OpenAI',
        modelSmart: 'Smart',
        modelFast: 'Rask',
        modelCheapest: 'Billigst',
        modelBest: 'Beste',
        modelPremium: 'Premium',
        modelClaudeGroup: 'Anthropic (Claude)',
        modelOtherGroup: 'Annet',
        modelLocal: 'Lokal modell (LM Studio/Ollama)',
        modelCustom: 'Egendefinert...',
        // Placeholders
        placeholderAppType: 'F.eks. quiz-spill, todo-liste, kalkulator, portfolio, chatbot...',
        placeholderAudience: 'F.eks. elever, lærere, meg selv, bedrifter...',
        placeholderMainFeature: 'Skriv hva brukeren skal kunne gjøre, hva som skal skje når de klikker, hvilke resultater de skal se...',
        placeholderData: 'F.eks. brukerpoeng, historikk, favoritter, innstillinger...',
        placeholderInteractions: 'F.eks. animasjoner, lydeffekter, visuell feedback...',
        placeholderOther: 'F.eks. dark mode toggle, mobilvennlig, tilgjengelighet, spesifikke farger...',
        // Suggestion chips
        chipQuiz: '🎮 Quiz-spill',
        chipTodo: '📝 Todo-liste',
        chipCalculator: '🔢 Kalkulator',
        chipPortfolio: '💼 Portfolio',
        chipBudget: '💰 Budsjett-sporer',
        chipWeather: '🌤️ Vær-app',
        // Design options
        designModern: 'Moderne & Glassmorphic',
        designGamer: 'Gamer/Neon',
        designColorful: 'Fargerik & Leken',
        designProfessional: 'Profesjonell',
        designDark: 'Dark Mode',
        designGradient: 'Gradient & 3D',
        // AI section
        aiImproveBtn: '✨ Forbedre',
        aiVersion: '🤖 AI-forbedret versjon:',
        aiDiscard: 'Forkast',
        aiApply: '✅ Bruk denne',
        // Progress
        progressStarting: 'Starter...',
        promptTip: '💡 <strong>Tips:</strong> Beskriv steg-for-steg hva brukeren skal kunne gjøre. Vær så detaljert som mulig!'
    },
    en: {
        heroBadge: '✨ AI-powered code generator',
        heroTitle: 'Build apps<br><span class="gradient-text">without coding</span>',
        heroSubtitle: 'Describe your idea, choose technology, and get ready-to-run code in seconds. Perfect for beginners and rapid prototypes.',
        heroFeature1: 'Ready in seconds',
        heroFeature2: 'One file, works everywhere',
        heroFeature3: 'Your key, your content',
        generator: 'Generator',
        help: 'Help',
        about: 'About',
        wizardStep1: 'API Key',
        wizardStep2: 'Describe app',
        wizardStep3: 'Generate',
        step1Title: 'Connect to AI',
        step1Desc: 'Enter your API key to get started',
        step2Title: 'Describe your dream app',
        step2Desc: 'Answer the questions below to create a detailed description. The more you tell us, the better the result!',
        step3Title: 'Your app is ready!',
        step3Desc: 'The result is shown below. You can preview, download or copy the code.',
        continueBtn: 'Continue to next step',
        backBtn: 'Back',
        generateBtn: '🚀 Generate app',
        regenerateBtn: '🔄 Regenerate',
        startOverBtn: '🔁 Start over',
        validating: 'Validating key...',
        validSuccess: 'Key validated! Ready to continue.',
        validError: 'Invalid key. Make sure you copied the entire key.',
        securityTitle: 'Your key is safe',
        securityDesc: 'Your API key is sent directly from your browser to the selected provider. It is never stored on our servers – everything happens locally on your device.',
        promptQ1: 'What kind of app do you want to create?',
        promptQ2: 'Who is the target audience?',
        promptQ3: 'Describe the main function in detail',
        promptQ4: 'What data should be stored/displayed?',
        promptQ5: 'Interactions - what should happen?',
        promptQ6: 'What design/mood?',
        promptQ7: 'Special requests?',
        promptRequired: 'Fill out at least questions 1 and 3',
        aiImproveTitle: 'AI-assisted improvement',
        aiImproveDesc: 'Let AI enhance and expand your description with professional details',
        aiImproving: 'AI is improving your description...',
        promptPreviewTitle: '📝 Your prompt',
        showPreview: 'Show preview',
        hidePreview: 'Hide preview',
        statusReady: 'ready',
        statusNeedKey: 'missing API key',
        statusCalling: 'calling model',
        statusDone: 'done',
        statusFail: 'error',
        statusNotConfigured: 'not configured',
        statusConfigured: 'configured',
        outNone: 'none',
        output: 'Output',
        preview: '👁️ Preview',
        copy: '📋 Copy',
        download: '💾 Download',
        downloadZip: '📦 Download ZIP',
        showFiles: '📂 Show files',
        projectTips: '💡 Project tips',
        noteKey: 'Tip: never put API keys in generated code',
        refineTitle: 'Not quite satisfied?',
        refineDesc: 'Describe what you want to change or improve',
        refinePlaceholder: "E.g. 'Make the buttons larger', 'Add a footer', 'Change color theme to blue', 'Fix the bug with...'",
        refineBtn: '🔄 Refine code',
        refineLoading: 'AI is refining your code...',
        // Provider instructions
        providerGoogleTitle: '🚀 How to get Google API key:',
        providerGoogleStep1: 'Go to',
        providerGoogleStep2: 'Sign in with your Google account',
        providerGoogleStep3: 'Click "Create API Key"',
        providerGoogleStep4: 'Copy the key (starts with',
        providerOpenAITitle: '🔐 How to get OpenAI API key:',
        providerOpenAIStep1: 'Go to',
        providerOpenAIStep2: 'Create account or sign in',
        providerOpenAIStep3: 'Click "Create new secret key"',
        providerOpenAIStep4: 'Copy the key (starts with',
        providerAnthropicTitle: '🟣 How to get Anthropic API key:',
        providerAnthropicStep1: 'Go to',
        providerAnthropicStep2: 'Create account or sign in',
        providerAnthropicStep3: 'Click "Create Key"',
        providerAnthropicStep4: 'Copy the key (starts with',
        // Labels and placeholders
        apiKeyLabel: 'API Key',
        apiKeyPlaceholder: 'Paste your API key here...',
        advancedSettings: '⚙️ Advanced settings',
        endpointLabel: 'API endpoint',
        modelLabel: 'Model',
        rememberKeyLabel: 'Save key',
        rememberNo: 'Don\'t save (recommended)',
        rememberLocal: 'Save locally in browser',
        rememberHint: '⚠️ Saving not recommended on shared machines',
        technologyLabel: 'Technology',
        techHtmlCssJs: 'Pure HTML/CSS/JS (recommended)',
        techTailwind: 'HTML + Tailwind CSS',
        techReact: 'React (ESM - no npm)',
        techCustom: 'Custom...',
        techCustomPlaceholder: 'Enter technology...',
        // Model groups
        modelGeminiGroup: 'Google Gemini (Recommended)',
        modelGeminiFast: 'Fast',
        modelGeminiPowerful: 'Powerful',
        modelGeminiNewest: 'Newest',
        modelGeminiBest: 'Best',
        modelOpenAIGroup: 'OpenAI',
        modelSmart: 'Smart',
        modelFast: 'Fast',
        modelCheapest: 'Cheapest',
        modelBest: 'Best',
        modelPremium: 'Premium',
        modelClaudeGroup: 'Anthropic (Claude)',
        modelOtherGroup: 'Other',
        modelLocal: 'Local model (LM Studio/Ollama)',
        modelCustom: 'Custom...',
        // Placeholders
        placeholderAppType: 'E.g. quiz game, todo list, calculator, portfolio, chatbot...',
        placeholderAudience: 'E.g. students, teachers, myself, businesses...',
        placeholderMainFeature: 'Describe what the user should be able to do, what happens when they click, what results they see...',
        placeholderData: 'E.g. user scores, history, favorites, settings...',
        placeholderInteractions: 'E.g. animations, sound effects, visual feedback...',
        placeholderOther: 'E.g. dark mode toggle, mobile-friendly, accessibility, specific colors...',
        // Suggestion chips
        chipQuiz: '🎮 Quiz game',
        chipTodo: '📝 Todo list',
        chipCalculator: '🔢 Calculator',
        chipPortfolio: '💼 Portfolio',
        chipBudget: '💰 Budget tracker',
        chipWeather: '🌤️ Weather app',
        // Design options
        designModern: 'Modern & Glassmorphic',
        designGamer: 'Gamer/Neon',
        designColorful: 'Colorful & Playful',
        designProfessional: 'Professional',
        designDark: 'Dark Mode',
        designGradient: 'Gradient & 3D',
        // AI section
        aiImproveBtn: '✨ Improve',
        aiVersion: '🤖 AI-improved version:',
        aiDiscard: 'Discard',
        aiApply: '✅ Use this',
        // Progress
        progressStarting: 'Starting...',
        promptTip: '💡 <strong>Tip:</strong> Describe step-by-step what the user should be able to do. Be as detailed as possible!'
    }
};

// ============================================
// WIZARD NAVIGATION
// ============================================

function goToStep(step, skipScroll = false) {
    if (step < 1 || step > 3) return;

    state.currentStep = step;

    // Update step indicators
    document.querySelectorAll('.wizard-step').forEach((el, idx) => {
        el.classList.remove('active', 'completed');
        if (idx + 1 < step) {
            el.classList.add('completed');
        } else if (idx + 1 === step) {
            el.classList.add('active');
        }
    });

    // Update step lines
    document.querySelectorAll('.wizard-step-line').forEach((el, idx) => {
        el.classList.toggle('completed', idx < step - 1);
    });

    // Update panels
    document.querySelectorAll('.wizard-panel').forEach((el, idx) => {
        el.classList.toggle('active', idx + 1 === step);
    });

    // Scroll to top of wizard (but not on initial load)
    if (!skipScroll) {
        document.querySelector('.wizard-steps')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function validateStep1() {
    const apiKey = $('apiKey').value.trim();
    const provider = state.selectedProvider;
    const config = providerConfig[provider];

    if (!apiKey) {
        state.apiValidated = false;
        $('step1NextBtn').disabled = true;
        showValidation(null);
        return;
    }

    // Check prefix
    if (config.prefix && !apiKey.startsWith(config.prefix)) {
        showValidation('error');
        state.apiValidated = false;
        $('step1NextBtn').disabled = true;
        return;
    }

    // Show success (we'll do real validation on generate)
    showValidation('success');
    state.apiValidated = true;
    $('step1NextBtn').disabled = false;
}

function validateStep2() {
    const appType = $('promptAppType').value.trim();
    const mainFeature = $('promptMainFeature').value.trim();

    const isValid = appType.length > 0 && mainFeature.length > 0;
    $('step2NextBtn').disabled = !isValid;

    // Update prompt preview
    updatePromptPreview();
}

// Consolidated validation display function
// type: 'pending' | 'success' | 'error' | null (null hides all)
function showValidation(type) {
    const types = ['Pending', 'Success', 'Error'];
    types.forEach(t => {
        const el = $(`validation${t}`);
        if (el) el.classList.toggle('hidden', t.toLowerCase() !== type);
    });
}

// ============================================
// PROVIDER SELECTION
// ============================================

function selectProvider(provider) {
    state.selectedProvider = provider;

    // Update UI
    document.querySelectorAll('.provider-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.provider === provider);
    });

    document.querySelectorAll('.provider-instruction').forEach(el => {
        el.classList.toggle('active', el.dataset.provider === provider);
    });

    // Update endpoint
    const config = providerConfig[provider];
    if (config) {
        $('endpoint').value = config.endpoint;

        // Update model dropdown to show relevant models
        const modelSelect = $('model');
        const firstModel = config.models[0];
        if (firstModel && modelSelect.querySelector(`option[value="${firstModel}"]`)) {
            modelSelect.value = firstModel;
        }
    }

    // Re-validate
    validateStep1();
}

// ============================================
// PROMPT BUILDING
// ============================================

// Design-specific instructions for each style
const designInstructions = {
    'moderne': {
        no: `- Glassmorphism effekter med backdrop-filter: blur(20px)
- Semi-transparente kort med rgba(255,255,255,0.1) bakgrunn
- Subtile gradient borders (1px solid rgba(255,255,255,0.2))
- Soft box-shadows med blur og spread
- Floating elements med subtle shadows
- Minimalistiske ikoner (outline style)
- Mye whitespace og luftig layout
- Elegant typografi med thin/light font weights
- Frosted glass effekt på navigasjon/modals
- Subtle hover states med opacity endringer`,
        en: `- Glassmorphism effects with backdrop-filter: blur(20px)
- Semi-transparent cards with rgba(255,255,255,0.1) background
- Subtle gradient borders (1px solid rgba(255,255,255,0.2))
- Soft box-shadows with blur and spread
- Floating elements with subtle shadows
- Minimalistic icons (outline style)
- Lots of whitespace and airy layout
- Elegant typography with thin/light font weights
- Frosted glass effect on navigation/modals
- Subtle hover states with opacity changes`
    },
    'gamer': {
        no: `- Neon glow effekter med box-shadow: 0 0 20px cyan/magenta
- Cyberpunk fargeskjema: svart bakgrunn med cyan (#00ffff), magenta (#ff00ff), lime (#00ff00)
- Animated neon borders som pulserer
- Glitch-effekter på tekst (text-shadow med offset farger)
- Scanline overlay effekt (repeating-linear-gradient)
- Futuristiske fonter (monospace, tech-style)
- HUD-inspirerte UI elementer
- Flicker/blink animasjoner på neon elementer
- RGB/rainbow gradient animasjoner
- Terminal/console estetikk med grønn tekst
- Intense hover effects med glow intensitet`,
        en: `- Neon glow effects with box-shadow: 0 0 20px cyan/magenta
- Cyberpunk color scheme: black background with cyan (#00ffff), magenta (#ff00ff), lime (#00ff00)
- Animated neon borders that pulse
- Glitch effects on text (text-shadow with offset colors)
- Scanline overlay effect (repeating-linear-gradient)
- Futuristic fonts (monospace, tech-style)
- HUD-inspired UI elements
- Flicker/blink animations on neon elements
- RGB/rainbow gradient animations
- Terminal/console aesthetic with green text
- Intense hover effects with glow intensity`
    },
    'fargerik': {
        no: `- Livlige, mettede farger: korall, turkis, gul, lilla
- Lekne illustrasjoner og store emoji-ikoner
- Bouncy animasjoner med cubic-bezier(0.68, -0.55, 0.265, 1.55)
- Avrundede hjørner (border-radius: 20px+)
- Confetti/particle effekter
- Playful hover states (scale, rotate, wobble)
- Gradient bakgrunner med flere farger
- Blob/organic former som dekorasjon
- Stor, bold typografi
- Shadows med fargetone (ikke bare grå)
- Wave/bølge animasjoner
- Fun loading animasjoner (jumping dots, spinning shapes)`,
        en: `- Vibrant, saturated colors: coral, turquoise, yellow, purple
- Playful illustrations and large emoji icons
- Bouncy animations with cubic-bezier(0.68, -0.55, 0.265, 1.55)
- Rounded corners (border-radius: 20px+)
- Confetti/particle effects
- Playful hover states (scale, rotate, wobble)
- Gradient backgrounds with multiple colors
- Blob/organic shapes as decoration
- Large, bold typography
- Colored shadows (not just gray)
- Wave animations
- Fun loading animations (jumping dots, spinning shapes)`
    },
    'profesjonell': {
        no: `- Nøytralt fargeskjema: hvit, grå, svart, én accent-farge
- Mye whitespace og grid-basert layout
- Subtile borders (1px solid #e5e7eb)
- Ingen flashy animasjoner - kun fade og subtle transforms
- Profesjonell typografi (Inter, Roboto, eller system fonts)
- Flat design uten shadows eller minimal shadow
- Tydelig visuelt hierarki
- Ikoner fra professional icon sets (outline, consistent stroke)
- Hover states med bakgrunnsfarge-endring
- Data-tables med zebra striping
- Form validation med inline feedback
- Clean button styles uten gradients`,
        en: `- Neutral color scheme: white, gray, black, one accent color
- Lots of whitespace and grid-based layout
- Subtle borders (1px solid #e5e7eb)
- No flashy animations - only fade and subtle transforms
- Professional typography (Inter, Roboto, or system fonts)
- Flat design without shadows or minimal shadow
- Clear visual hierarchy
- Icons from professional icon sets (outline, consistent stroke)
- Hover states with background color change
- Data tables with zebra striping
- Form validation with inline feedback
- Clean button styles without gradients`
    },
    'dark': {
        no: `- Rik, dyp svart bakgrunn (#0a0a0f eller #09090b)
- Elegant lysgrå tekst (#e4e4e7) med god kontrast
- Premium accent-farger: gull (#fbbf24), lilla (#a855f7), eller emerald (#10b981)
- Subtle glow på interaktive elementer
- Card backgrounds med #18181b eller rgba(24,24,27,0.8)
- Elegant borders med rgba(255,255,255,0.1)
- Sophisticated hover states med subtle brightness økning
- Premium ikoner med glow effekt
- Shadows som forsterker dybde (ikke for synlige)
- Gradient accents som highlights
- Smooth, elegant animasjoner (ease-out, longer duration)
- Luksuriøs typografi med letter-spacing`,
        en: `- Rich, deep black background (#0a0a0f or #09090b)
- Elegant light gray text (#e4e4e7) with good contrast
- Premium accent colors: gold (#fbbf24), purple (#a855f7), or emerald (#10b981)
- Subtle glow on interactive elements
- Card backgrounds with #18181b or rgba(24,24,27,0.8)
- Elegant borders with rgba(255,255,255,0.1)
- Sophisticated hover states with subtle brightness increase
- Premium icons with glow effect
- Shadows that enhance depth (not too visible)
- Gradient accents as highlights
- Smooth, elegant animations (ease-out, longer duration)
- Luxurious typography with letter-spacing`
    },
    'gradient': {
        no: `- Rike, levende gradient bakgrunner (mesh gradients, multi-color)
- 3D transforms på kort (perspective, rotateX/Y)
- Parallax scroll effekter
- Gradient tekst med background-clip: text
- Floating 3D objekter med animert rotation
- Depth med layered shadows (multiple box-shadows)
- Glassmorphism kombinert med gradients
- Animated gradient borders (hue-rotate animation)
- 3D buttons med push-down effekt
- Isometric eller pseudo-3D elementer
- Gradient mesh bakgrunner
- Aurora/northern lights animasjoner
- Morphing blob shapes i bakgrunnen`,
        en: `- Rich, vibrant gradient backgrounds (mesh gradients, multi-color)
- 3D transforms on cards (perspective, rotateX/Y)
- Parallax scroll effects
- Gradient text with background-clip: text
- Floating 3D objects with animated rotation
- Depth with layered shadows (multiple box-shadows)
- Glassmorphism combined with gradients
- Animated gradient borders (hue-rotate animation)
- 3D buttons with push-down effect
- Isometric or pseudo-3D elements
- Gradient mesh backgrounds
- Aurora/northern lights animations
- Morphing blob shapes in background`
    }
};

// Helper function to get design instructions based on style value
function getDesignInstructions(styleValue, lang) {
    const langKey = lang === 'no' ? 'no' : 'en';

    if (styleValue.includes('Moderne') || styleValue.includes('Modern') || styleValue.includes('Glassmorphic')) {
        return designInstructions.moderne[langKey];
    } else if (styleValue.includes('Gamer') || styleValue.includes('Neon') || styleValue.includes('Cyberpunk')) {
        return designInstructions.gamer[langKey];
    } else if (styleValue.includes('Fargerik') || styleValue.includes('Colorful') || styleValue.includes('Leken') || styleValue.includes('Playful')) {
        return designInstructions.fargerik[langKey];
    } else if (styleValue.includes('Profesjonell') || styleValue.includes('Professional') || styleValue.includes('Minimalistisk')) {
        return designInstructions.profesjonell[langKey];
    } else if (styleValue.includes('Dark Mode')) {
        return designInstructions.dark[langKey];
    } else if (styleValue.includes('Gradient') || styleValue.includes('3D')) {
        return designInstructions.gradient[langKey];
    }

    // Default to moderne
    return designInstructions.moderne[langKey];
}

function buildUserPrompt() {
    const appType = $('promptAppType').value.trim();
    const audience = $('promptAudience').value.trim();
    const mainFeature = $('promptMainFeature').value.trim();
    const data = $('promptData').value.trim();
    const interactions = $('promptInteractions').value.trim();
    const style = document.querySelector('input[name="designStyle"]:checked')?.value || '💎 Moderne & Glassmorphic';
    const other = $('promptOther').value.trim();

    const lang = state.uiLang;

    let prompt = lang === 'no'
        ? `Lag en PREMIUM ${appType}`
        : `Create a PREMIUM ${appType}`;

    if (audience) prompt += ` for ${audience}`;
    prompt += lang === 'no'
        ? ' med ALL BELLS & WHISTLES!\n\n'
        : ' with ALL BELLS & WHISTLES!\n\n';

    prompt += lang === 'no' ? '🎯 HOVEDFUNKSJON:\n' : '🎯 MAIN FUNCTION:\n';
    prompt += mainFeature + '\n\n';

    if (data) {
        prompt += lang === 'no' ? '💾 DATA & LAGRING:\n' : '💾 DATA & STORAGE:\n';
        prompt += data + '\n';
        prompt += lang === 'no'
            ? '- Bruk localStorage for å lagre data persistent\n- Legg til eksport/import funksjonalitet (JSON)\n\n'
            : '- Use localStorage to store data persistently\n- Add export/import functionality (JSON)\n\n';
    }

    if (interactions) {
        prompt += lang === 'no' ? '⚡ INTERAKSJONER:\n' : '⚡ INTERACTIONS:\n';
        prompt += interactions + '\n\n';
    }

    // Get style-specific design instructions
    const designDetails = getDesignInstructions(style, lang);

    prompt += lang === 'no' ? '🎨 DESIGN & UI/UX:\n' : '🎨 DESIGN & UI/UX:\n';
    prompt += `${style}\n`;
    prompt += designDetails + '\n';

    // Add common UI elements
    prompt += lang === 'no'
        ? `
- Smooth animasjoner og transitions (0.3s ease)
- Hover effekter på alle interaktive elementer
- Loading states og feedback
- Toast notifications for bruker-feedback

`
        : `
- Smooth animations and transitions (0.3s ease)
- Hover effects on all interactive elements
- Loading states and feedback
- Toast notifications for user feedback

`;

    prompt += lang === 'no' ? '✨ PREMIUM FUNKSJONER:\n' : '✨ PREMIUM FEATURES:\n';
    prompt += lang === 'no'
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
- Error handling with user-friendly messages

`;

    if (other) {
        prompt += lang === 'no' ? '🔧 ANDRE KRAV:\n' : '🔧 OTHER REQUIREMENTS:\n';
        prompt += other + '\n\n';
    }

    prompt += lang === 'no' ? '📋 TEKNISKE KRAV:\n' : '📋 TECHNICAL REQUIREMENTS:\n';
    prompt += lang === 'no'
        ? `- Semantisk HTML5
- Mobilvennlig responsive design (mobile-first)
- Tilgjengelighet (ARIA labels, keyboard navigation, god kontrast)
- Performance (optimaliserte animasjoner, lazy loading)
- Ren, organisert CSS (CSS Variables for farger/spacing)
- Vanilla JavaScript (ingen dependencies)
- All funksjonalitet uten backend (client-side only)
- localStorage for persistent data

🚀 GÅ ALL IN! Lag noe som ser ut som det koster 10 000 kr i design!`
        : `- Semantic HTML5
- Mobile-friendly responsive design (mobile-first)
- Accessibility (ARIA labels, keyboard navigation, good contrast)
- Performance (optimized animations, lazy loading)
- Clean, organized CSS (CSS Variables for colors/spacing)
- Vanilla JavaScript (no dependencies)
- All functionality without backend (client-side only)
- localStorage for persistent data

🚀 GO ALL IN! Make something that looks like it cost $10,000 in design!`;

    return prompt;
}

function updatePromptPreview() {
    const prompt = buildUserPrompt();
    $('generatedPromptText').textContent = prompt;
    $('goal').value = prompt;

    // Generate project name from app type
    const appType = $('promptAppType').value.trim();
    if (appType) {
        $('projectName').value = appType.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
}

// ============================================
// AI IMPROVEMENT
// ============================================

// Store the AI-improved prompt temporarily
state.aiImprovedPrompt = null;

async function improvePromptWithAI() {
    const apiKey = $('apiKey').value.trim();
    const endpoint = $('endpoint').value.trim();
    const model = $('model').value.trim();

    if (!apiKey) {
        alert(state.uiLang === 'no' ? 'Du må legge inn API-nøkkel først' : 'Please enter API key first');
        return;
    }

    const basePrompt = buildUserPrompt();

    // Show preview section and loading state
    $('aiImprovePreview').classList.remove('hidden');
    $('aiPreviewLoading').classList.remove('hidden');
    $('aiPreviewResult').classList.add('hidden');
    $('aiImproveBtn').disabled = true;

    const improveSystemPrompt = state.uiLang === 'no'
        ? `ROLLE: Du er en UX-designer og produktekspert som forbedrer app-beskrivelser.

OPPGAVE: Transformer brukerens enkle beskrivelse til en detaljert, profesjonell spesifikasjon.

LEGG TIL:
- Spesifikke UI-komponenter (kort, modaler, tabeller, skjemaer)
- Micro-interaksjoner (hover-effekter, loading-states, success-feedback)
- Brukerflyt (hva skjer når brukeren klikker, submitter, etc.)
- Eksempeldata som gjør appen realistisk
- Tilgjengelighets-features (keyboard-nav, skjermleser-støtte)

BEHOLD:
- Brukerens kjerneidé og hovedfunksjonalitet
- Eventuell teknisk stack nevnt
- Språket/tonen i originalen

FORMAT: Svar KUN med den forbedrede beskrivelsen. Ingen intro, ingen forklaring, bare den nye teksten.`
        : `ROLE: You are a UX designer and product expert who improves app descriptions.

TASK: Transform the user's simple description into a detailed, professional specification.

ADD:
- Specific UI components (cards, modals, tables, forms)
- Micro-interactions (hover effects, loading states, success feedback)
- User flow (what happens when user clicks, submits, etc.)
- Example data that makes the app realistic
- Accessibility features (keyboard nav, screen reader support)

KEEP:
- The user's core idea and main functionality
- Any technical stack mentioned
- The language/tone of the original

FORMAT: Reply ONLY with the improved description. No intro, no explanation, just the new text.`;

    try {
        const res = await makeApiCall(endpoint, apiKey, model, improveSystemPrompt, basePrompt, 0.8, 2000);

        if (res.ok) {
            const json = await res.json();
            const content = extractContent(json, endpoint);
            if (content) {
                state.aiImprovedPrompt = content;
                $('aiPreviewContent').textContent = content;
                $('aiPreviewResult').classList.remove('hidden');
            }
        } else {
            const errorText = await res.text();
            safeLogError('AI improve error:', errorText);
            $('aiImprovePreview').classList.add('hidden');
            alert(state.uiLang === 'no' ? 'Kunne ikke forbedre prompten. Sjekk API-nøkkelen.' : 'Could not improve prompt. Check API key.');
        }
    } catch (e) {
        safeLogError('AI improve error:', e);
        $('aiImprovePreview').classList.add('hidden');
        alert(state.uiLang === 'no' ? 'Feil ved AI-forbedring: ' + e.message : 'AI improvement error: ' + e.message);
    } finally {
        $('aiPreviewLoading').classList.add('hidden');
        $('aiImproveBtn').disabled = false;
    }
}

function applyAIImprovement() {
    if (state.aiImprovedPrompt) {
        // Update the prompt preview with AI-improved text
        $('generatedPromptText').textContent = state.aiImprovedPrompt;

        // Store in goal field for generation
        $('goal').value = state.aiImprovedPrompt;

        // Open the prompt preview so user sees the change
        const content = $('promptPreviewContent');
        const btn = $('togglePromptPreview');
        const text = $('togglePromptText');
        const t = i18n[state.uiLang];

        content.classList.remove('hidden');
        btn.classList.add('open');
        text.textContent = t.hidePreview;

        // Hide AI preview section
        $('aiImprovePreview').classList.add('hidden');
        state.aiImprovedPrompt = null;

        // Generate project name from app type
        const appType = $('promptAppType').value.trim();
        if (appType) {
            $('projectName').value = appType.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        }
    }
}

function discardAIImprovement() {
    state.aiImprovedPrompt = null;
    $('aiImprovePreview').classList.add('hidden');
}

// ============================================
// CODE GENERATION
// ============================================

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

// Note: percent parameter kept for backwards compatibility but unused
// (progress bar was replaced with spinner)
function updateProgress(_percent, text) {
    $('progressText').textContent = text;
}

function setApiState() {
    const key = $('apiKey').value.trim();
    const t = i18n[state.uiLang];
    $('apiState').textContent = key ? t.statusConfigured : t.statusNotConfigured;
    $('apiState').className = 'status-badge ' + (key ? 'success' : 'error');
}

function buildPrompt() {
    const lang = state.uiLang;
    const isNo = lang === 'no';

    let stackValue = $('stack').value;
    if (stackValue === 'custom') {
        stackValue = $('stackCustom').value.trim() || 'html-css-js';
    }

    const projectName = $('projectName').value.trim() || (isNo ? 'min-app' : 'my-app');
    const goal = $('goal').value.trim();

    const spec = {
        project_name: projectName,
        goal: goal,
        stack: stackValue,
        output_language: lang,
        output_mode: 'single'
    };

    // Stack-specific instructions (bilingual)
    const stackGuide = {
        'react': isNo
            ? `\n\n**REACT-SPESIFIKT:**
- Bruk React 18+ med ESM imports fra esm.sh
- Inkluder createRoot fra react-dom/client
- Bruk hooks (useState, useEffect, etc.)
- Koden MÅ kjøre direkte i nettleseren uten npm/build`
            : `\n\n**REACT-SPECIFIC:**
- Use React 18+ with ESM imports from esm.sh
- Include createRoot from react-dom/client
- Use hooks (useState, useEffect, etc.)
- Code MUST run directly in browser without npm/build`
    };

    const stackInstructions = stackGuide[stackValue] || '';

    // System prompt with clear role definition (bilingual)
    const sys = isNo
        ? `ROLLE: Du er en senior frontend-utvikler som genererer produksjonsklar kode.

MÅL: Lag "${projectName}" - ${goal}

BEGRENSNINGER:
- Kun browser-kode (ingen server, ingen build-steg)
- All kode inline i én HTML-fil
- Bruk CDN eller ESM imports for biblioteker

KVALITETSKRAV:
1. Null console-feil ved lasting og bruk
2. Fungerer på viewports 320px-1920px (mobil til desktop)
3. Alle features i beskrivelsen må være implementert og fungere
4. Realistiske eksempeldata (ikke "Lorem ipsum" eller tomme lister)
5. Keyboard-navigasjon og ARIA-labels for tilgjengelighet
6. Try/catch rundt async-operasjoner med brukervenlige feilmeldinger${stackInstructions}

DESIGN-SYSTEM:
- Fargeskjema: Mørk bakgrunn (#0a0a0f), lys tekst (#f1f5f9), accent (#38bdf8 eller #8b5cf6)
- Typografi: Google Fonts (Inter, Outfit, eller lignende), god hierarki
- Komponenter: Kort med rgba(30,41,59,0.6) bakgrunn, subtle borders, hover-glow på knapper
- Animasjoner: fadeIn på load, smooth hover-transforms (0.2s ease), loading-spinners
- Layout: CSS Grid/Flexbox, CSS custom properties for farger/spacing`

        : `ROLE: You are a senior frontend developer generating production-ready code.

GOAL: Build "${projectName}" - ${goal}

CONSTRAINTS:
- Browser-only code (no server, no build step)
- All code inline in a single HTML file
- Use CDN or ESM imports for libraries

QUALITY REQUIREMENTS:
1. Zero console errors on load and during use
2. Works on viewports 320px-1920px (mobile to desktop)
3. All features in the description must be implemented and functional
4. Realistic example data (no "Lorem ipsum" or empty lists)
5. Keyboard navigation and ARIA labels for accessibility
6. Try/catch around async operations with user-friendly error messages${stackInstructions}

DESIGN SYSTEM:
- Color scheme: Dark background (#0a0a0f), light text (#f1f5f9), accent (#38bdf8 or #8b5cf6)
- Typography: Google Fonts (Inter, Outfit, or similar), good hierarchy
- Components: Cards with rgba(30,41,59,0.6) background, subtle borders, hover-glow on buttons
- Animations: fadeIn on load, smooth hover-transforms (0.2s ease), loading spinners
- Layout: CSS Grid/Flexbox, CSS custom properties for colors/spacing`;

    // Output format instructions (bilingual, consolidated)
    const format = isNo
        ? `SVAR KUN MED JSON i dette formatet:
{
  "index_html": "<komplett HTML-dokument med inline CSS og JS>",
  "files": [],
  "notes": "valgfri kort merknad"
}

VIKTIG:
- index_html skal være en komplett, kjørbar HTML-fil
- files skal alltid være tom liste [] (single-file mode)
- Ingen API-nøkler eller hemmeligheter i koden
- Inkluder <!DOCTYPE html>, <html>, <head>, <body> tags`

        : `RESPOND ONLY WITH JSON in this format:
{
  "index_html": "<complete HTML document with inline CSS and JS>",
  "files": [],
  "notes": "optional short note"
}

IMPORTANT:
- index_html must be a complete, runnable HTML file
- files must always be empty array [] (single-file mode)
- No API keys or secrets in the code
- Include <!DOCTYPE html>, <html>, <head>, <body> tags`;

    const userPrompt = isNo
        ? `Prosjektspesifikasjon:\n${JSON.stringify(spec, null, 2)}\n\n${format}`
        : `Project specification:\n${JSON.stringify(spec, null, 2)}\n\n${format}`;

    return { sys, user: userPrompt };
}

async function callModel() {
    const t = i18n[state.uiLang];
    const endpoint = $('endpoint').value.trim();
    const model = $('model').value.trim();
    const apiKey = $('apiKey').value.trim();

    if (!apiKey) {
        setStatus('warn', t.statusNeedKey);
        return;
    }

    enableOutputActions(false);
    const { sys, user } = buildPrompt();

    setStatus('', t.statusCalling);
    showProgress(true);
    updateProgress(10, state.uiLang === 'no' ? '🔗 Kobler til API...' : '🔗 Connecting to API...');

    let currentProgress = 10;
    let progressInterval = null;

    try {
        updateProgress(25, state.uiLang === 'no' ? '📤 Sender forespørsel...' : '📤 Sending request...');
        currentProgress = 25;

        const res = await makeApiCall(endpoint, apiKey, model, sys, user, 0.7, 16000);

        updateProgress(50, state.uiLang === 'no' ? '⚡ AI genererer kode...' : '⚡ AI generating code...');
        currentProgress = 50;

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

            let msg = `${t.statusFail}: ${res.status}`;
            if (res.status === 429) {
                msg = state.uiLang === 'no' ? 'Rate limit nådd (429)' : 'Rate limit exceeded (429)';
            } else if (res.status === 401) {
                msg = state.uiLang === 'no' ? 'Ugyldig API-key' : 'Invalid API key';
            }

            setStatus('bad', msg);
            return;
        }

        if (progressInterval) clearInterval(progressInterval);

        updateProgress(75, state.uiLang === 'no' ? '📥 Mottar respons...' : '📥 Receiving response...');

        const json = await res.json();
        const content = extractContent(json, endpoint);
        if (typeof content !== 'string') {
            renderOutput(JSON.stringify(json, null, 2));
            showProgress(false);
            setStatus('warn', 'warning');
            return;
        }

        updateProgress(90, state.uiLang === 'no' ? '🔧 Behandler kode...' : '🔧 Processing code...');

        renderOutput(content);

        updateProgress(100, state.uiLang === 'no' ? '✅ Ferdig!' : '✅ Done!');
        setTimeout(() => showProgress(false), 1000);

        setStatus('good', t.statusDone);

        // Mark step 3 as completed
        const step3 = document.querySelectorAll('.wizard-step')[2];
        if (step3) {
            step3.classList.remove('active');
            step3.classList.add('completed');
        }
        document.querySelectorAll('.wizard-step-line')[1]?.classList.add('completed');

    } catch (e) {
        if (progressInterval) clearInterval(progressInterval);
        renderOutput(String(e));
        showProgress(false);
        setStatus('bad', t.statusFail);
    }
}

// ============================================
// REFINE OUTPUT
// ============================================

async function refineOutput() {
    const t = i18n[state.uiLang];
    const endpoint = $('endpoint').value.trim();
    const model = $('model').value.trim();
    const apiKey = $('apiKey').value.trim();
    const refineInstructions = $('refineInput').value.trim();

    if (!apiKey) {
        alert(state.uiLang === 'no' ? 'Du må legge inn API-nøkkel først' : 'Please enter API key first');
        return;
    }

    if (!refineInstructions) {
        alert(state.uiLang === 'no' ? 'Skriv inn hva du vil endre' : 'Please describe what you want to change');
        return;
    }

    // Get current code
    const currentCode = state.last.parsed?.index_html || $('output').textContent || '';
    if (!currentCode.trim()) {
        alert(state.uiLang === 'no' ? 'Ingen kode å forbedre' : 'No code to refine');
        return;
    }

    // Show loading state
    $('refineLoading').classList.remove('hidden');
    $('btnRefine').disabled = true;

    const refineSystemPrompt = state.uiLang === 'no'
        ? `Du er en ekspert webutvikler. Din oppgave er å FORBEDRE eksisterende kode basert på brukerens instruksjoner.

REGLER:
1. Behold all eksisterende funksjonalitet som ikke eksplisitt skal endres
2. Implementer ALLE endringene brukeren ber om
3. Hold samme kodestil og struktur
4. Returner KOMPLETT, kjørbar kode (ikke bare utdrag)
5. Hvis brukeren ber om noe uklart, gjør ditt beste for å tolke ønsket

Svar KUN med JSON i dette formatet:
{
  "index_html": "... komplett oppdatert HTML/CSS/JS ...",
  "files": [],
  "notes": "kort beskrivelse av endringene"
}`
        : `You are an expert web developer. Your task is to IMPROVE existing code based on user instructions.

RULES:
1. Keep all existing functionality that is not explicitly changed
2. Implement ALL changes the user requests
3. Maintain the same code style and structure
4. Return COMPLETE, runnable code (not just snippets)
5. If the user asks for something unclear, do your best to interpret the request

Reply ONLY with JSON in this format:
{
  "index_html": "... complete updated HTML/CSS/JS ...",
  "files": [],
  "notes": "brief description of changes"
}`;

    const userPrompt = state.uiLang === 'no'
        ? `Her er den eksisterende koden:\n\n\`\`\`html\n${currentCode}\n\`\`\`\n\nBrukerens ønskede endringer:\n${refineInstructions}\n\nOppdater koden og returner den komplette, forbedrede versjonen.`
        : `Here is the existing code:\n\n\`\`\`html\n${currentCode}\n\`\`\`\n\nUser's requested changes:\n${refineInstructions}\n\nUpdate the code and return the complete, improved version.`;

    try {
        setStatus('', state.uiLang === 'no' ? 'Forbedrer kode...' : 'Refining code...');

        const res = await makeApiCall(endpoint, apiKey, model, refineSystemPrompt, userPrompt, 0.7, 16000);

        if (!res.ok) {
            const errorText = await res.text();
            safeLogError('Refine error:', errorText);
            alert(state.uiLang === 'no' ? 'Kunne ikke forbedre koden. Prøv igjen.' : 'Could not refine code. Please try again.');
            setStatus('bad', t.statusFail);
            return;
        }

        const json = await res.json();
        const content = extractContent(json, endpoint);

        if (content) {
            renderOutput(content);
            setStatus('good', t.statusDone);

            // Clear the refine input after successful refinement
            $('refineInput').value = '';
            $('btnRefine').disabled = true;

            // Show success feedback
            const btn = $('btnRefine');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span>✅ ' + (state.uiLang === 'no' ? 'Kode oppdatert!' : 'Code updated!') + '</span>';
            setTimeout(() => {
                btn.innerHTML = originalText;
            }, 2000);
        } else {
            setStatus('warn', 'warning');
        }
    } catch (e) {
        safeLogError('Refine error:', e);
        alert(state.uiLang === 'no' ? 'Feil ved forbedring: ' + e.message : 'Refine error: ' + e.message);
        setStatus('bad', t.statusFail);
    } finally {
        $('refineLoading').classList.add('hidden');
        $('btnRefine').disabled = !$('refineInput').value.trim();
    }
}

// ============================================
// OUTPUT HANDLING
// ============================================

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
    $('btnProjectTips').disabled = !on;

    const parsed = state.last.parsed;
    const hasFiles = parsed && parsed.files && parsed.files.length > 0;

    $('btnShowFiles').disabled = !on || !hasFiles;
    $('btnShowFiles').classList.toggle('hidden', !hasFiles);
    $('btnDownloadAll').disabled = !on || !hasFiles;
    $('btnDownloadAll').classList.toggle('hidden', !hasFiles);

    // Show/hide refine section based on whether we have output
    const refineSection = $('refineSection');
    if (refineSection) {
        refineSection.classList.toggle('hidden', !on);
    }
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
        state.last.hasIndex = true;
        state.last.fileCount = parsed.files ? parsed.files.length : 0;
        updateMetaDisplay();
        enableOutputActions(true);
        return;
    }

    outputEl.textContent = state.last.raw;

    if (state.last.raw.trim()) {
        outputEl.classList.remove('empty');
    } else {
        outputEl.classList.add('empty');
    }

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
            $('outMeta').textContent = `index.html + ${fileCount} filer`;
        } else {
            $('outMeta').textContent = 'index.html';
        }
    } else {
        $('outMeta').textContent = t.outNone;
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

// ============================================
// PREVIEW MODAL - Helper Functions
// ============================================

function createPreviewModalHTML() {
    const isNo = state.uiLang === 'no';
    return `
        <div class="preview-modal preview-modal-editor">
            <div class="preview-header">
                <span class="preview-title">✨ ${isNo ? 'Rediger & Forhåndsvis' : 'Edit & Preview'}</span>
                <div class="preview-actions">
                    <button class="preview-btn preview-btn-save" id="previewSave" title="${isNo ? 'Lagre endringer' : 'Save changes'}">💾 ${isNo ? 'Lagre' : 'Save'}</button>
                    <button class="preview-btn" id="previewNewTab" title="${isNo ? 'Åpne i ny fane' : 'Open in new tab'}">↗</button>
                    <button class="preview-btn preview-close" id="previewClose" title="${isNo ? 'Lukk' : 'Close'}">✕</button>
                </div>
            </div>
            <div class="preview-main">
                <div class="preview-split">
                    <div class="preview-editor-pane">
                        <div class="preview-pane-header">
                            <span>📝 ${isNo ? 'Kode' : 'Code'}</span>
                            <span class="editor-hint">${isNo ? 'Endringer oppdateres live' : 'Changes update live'}</span>
                        </div>
                        <textarea class="preview-editor" id="previewEditor" spellcheck="false"></textarea>
                    </div>
                    <div class="preview-divider" id="previewDivider"></div>
                    <div class="preview-iframe-pane">
                        <div class="preview-pane-header">
                            <span>👁️ ${isNo ? 'Forhåndsvisning' : 'Preview'}</span>
                            <button class="preview-btn-small" id="previewRefresh" title="${isNo ? 'Oppdater' : 'Refresh'}">🔄</button>
                        </div>
                        <iframe class="preview-iframe" id="previewIframe" sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"></iframe>
                    </div>
                </div>
                <div class="preview-chat" id="previewChat">
                    <div class="preview-chat-resizer" id="chatResizer" title="${isNo ? 'Dra for å endre størrelse' : 'Drag to resize'}"></div>
                    <div class="preview-chat-header">
                        <span>🤖 ${isNo ? 'AI Assistent' : 'AI Assistant'}</span>
                        <button class="preview-btn-small" id="chatToggle" title="${isNo ? 'Vis/skjul chat' : 'Show/hide chat'}">▼</button>
                    </div>
                    <div class="preview-chat-messages" id="chatMessages">
                        <div class="chat-message chat-message-system">
                            ${isNo ? '👋 Hei! Beskriv endringene du ønsker, så oppdaterer jeg koden for deg.' : '👋 Hi! Describe the changes you want, and I\'ll update the code for you.'}
                        </div>
                    </div>
                    <div class="preview-chat-input">
                        <input type="text" id="chatInput" placeholder="${isNo ? 'Skriv hva du vil endre...' : 'Describe what you want to change...'}" />
                        <button class="chat-send-btn" id="chatSend" title="${isNo ? 'Send' : 'Send'}">
                            <span id="chatSendIcon">➤</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function setupPreviewEditor(overlay, html) {
    const editor = overlay.querySelector('#previewEditor');
    const iframe = overlay.querySelector('#previewIframe');
    let updateTimeout = null;

    const updatePreview = () => {
        iframe.srcdoc = editor.value;
    };

    editor.value = html;
    updatePreview();

    editor.addEventListener('input', () => {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(updatePreview, 300);
    });

    overlay.querySelector('#previewRefresh').addEventListener('click', updatePreview);

    return { editor, updatePreview };
}

function setupPreviewChat(overlay, editor, updatePreview) {
    const chatMessages = overlay.querySelector('#chatMessages');
    const chatInput = overlay.querySelector('#chatInput');
    const chatSendBtn = overlay.querySelector('#chatSend');
    const chatToggle = overlay.querySelector('#chatToggle');
    const chatPanel = overlay.querySelector('.preview-chat');
    const isNo = state.uiLang === 'no';

    chatToggle.addEventListener('click', () => {
        chatPanel.classList.toggle('collapsed');
        chatToggle.textContent = chatPanel.classList.contains('collapsed') ? '▲' : '▼';
    });

    const addMessage = (text, type) => {
        const msg = document.createElement('div');
        msg.className = `chat-message chat-message-${type}`;
        msg.textContent = text;
        chatMessages.appendChild(msg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const sendChatMessage = async () => {
        const message = chatInput.value.trim();
        if (!message) return;

        const apiKey = $('apiKey').value.trim();
        const endpoint = $('endpoint').value.trim();
        const model = $('model').value.trim();

        if (!apiKey) {
            addMessage(isNo ? '❌ Du må legge inn API-nøkkel først' : '❌ Please enter API key first', 'system');
            return;
        }

        addMessage(message, 'user');
        chatInput.value = '';
        chatSendBtn.disabled = true;

        const sendIcon = overlay.querySelector('#chatSendIcon');
        sendIcon.innerHTML = '<span class="chat-spinner"></span>';

        const systemPrompt = isNo
            ? `Du er en ekspert webutvikler som hjelper brukeren med å forbedre koden deres.
Din oppgave er å implementere endringene brukeren ber om.

REGLER:
1. Behold all eksisterende funksjonalitet som ikke skal endres
2. Implementer ALLE endringene brukeren ber om
3. Returner KOMPLETT, kjørbar kode (ikke bare utdrag)
4. Svar KUN med den oppdaterte HTML/CSS/JS koden, ingen forklaring eller markdown

VIKTIG: Returner BARE koden, ingen \`\`\`html tags eller annen tekst.`
            : `You are an expert web developer helping the user improve their code.
Your task is to implement the changes the user requests.

RULES:
1. Keep all existing functionality that shouldn't change
2. Implement ALL changes the user requests
3. Return COMPLETE, runnable code (not just snippets)
4. Reply ONLY with the updated HTML/CSS/JS code, no explanation or markdown

IMPORTANT: Return ONLY the code, no \`\`\`html tags or other text.`;

        const userPrompt = isNo
            ? `Her er koden:\n\n${editor.value}\n\nEndring: ${message}`
            : `Here is the code:\n\n${editor.value}\n\nChange: ${message}`;

        try {
            const res = await makeApiCall(endpoint, apiKey, model, systemPrompt, userPrompt, 0.7, 16000);

            if (!res.ok) {
                addMessage(isNo ? '❌ Kunne ikke oppdatere koden. Prøv igjen.' : '❌ Could not update code. Please try again.', 'system');
                return;
            }

            const json = await res.json();
            let content = extractContent(json, endpoint);

            if (content) {
                content = content.trim()
                    .replace(/^```html\n?/, '')
                    .replace(/^```\n?/, '')
                    .replace(/\n?```$/, '')
                    .trim();

                editor.value = content;
                updatePreview();
                addMessage(isNo ? '✅ Koden er oppdatert!' : '✅ Code updated!', 'system');
            } else {
                addMessage(isNo ? '❌ Fikk ikke gyldig respons' : '❌ Did not receive valid response', 'system');
            }
        } catch (e) {
            safeLogError('Chat error:', e);
            addMessage(isNo ? '❌ Feil: ' + e.message : '❌ Error: ' + e.message, 'system');
        } finally {
            chatSendBtn.disabled = false;
            sendIcon.innerHTML = '➤';
        }
    };

    chatSendBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });

    return chatInput;
}

function setupPreviewActions(overlay, editor) {
    const isNo = state.uiLang === 'no';

    // Save button
    overlay.querySelector('#previewSave').addEventListener('click', () => {
        state.last.parsed = {
            index_html: editor.value,
            files: state.last.parsed?.files || [],
            notes: ''
        };
        state.last.raw = JSON.stringify(state.last.parsed);
        state.last.hasIndex = true;

        $('output').textContent = editor.value;
        updateMetaDisplay();
        enableOutputActions(true);

        const saveBtn = overlay.querySelector('#previewSave');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = `✅ ${isNo ? 'Lagret!' : 'Saved!'}`;
        saveBtn.classList.add('saved');
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.classList.remove('saved');
        }, 1500);
    });

    // Open in new tab
    overlay.querySelector('#previewNewTab').addEventListener('click', () => {
        const blob = new Blob([editor.value], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    });
}

function setupPreviewResizer(overlay) {
    const divider = overlay.querySelector('#previewDivider');
    const editorPane = overlay.querySelector('.preview-editor-pane');
    let isResizing = false;

    divider.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        e.preventDefault();
    });

    const onMouseMove = (e) => {
        if (!isResizing) return;
        const container = overlay.querySelector('.preview-split');
        const rect = container.getBoundingClientRect();
        const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
        if (newWidth > 20 && newWidth < 80) {
            editorPane.style.width = newWidth + '%';
        }
    };

    const onMouseUp = () => {
        isResizing = false;
        document.body.style.cursor = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };
}

function setupChatResizer(overlay) {
    const resizer = overlay.querySelector('#chatResizer');
    const chatPanel = overlay.querySelector('#previewChat');
    let isResizing = false;
    let startY = 0;
    let startHeight = 0;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        startY = e.clientY;
        startHeight = chatPanel.offsetHeight;
        document.body.style.cursor = 'row-resize';
        e.preventDefault();
    });

    const onMouseMove = (e) => {
        if (!isResizing) return;
        const deltaY = startY - e.clientY;
        const newHeight = Math.min(Math.max(startHeight + deltaY, 100), window.innerHeight * 0.6);
        chatPanel.style.height = newHeight + 'px';
    };

    const onMouseUp = () => {
        isResizing = false;
        document.body.style.cursor = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };
}

function setupPreviewCloseHandlers(overlay, cleanupResizer, cleanupChatResizer) {
    const closeOverlay = () => {
        cleanupResizer();
        if (cleanupChatResizer) cleanupChatResizer();
        overlay.remove();
    };

    overlay.querySelector('#previewClose').addEventListener('click', closeOverlay);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeOverlay();
    });

    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeOverlay();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

// Main preview function - now orchestrates smaller helpers
function openPreview() {
    const parsed = state.last.parsed;
    const html = (parsed && parsed.index_html) ? parsed.index_html : ($('output').textContent || '');

    const overlay = document.createElement('div');
    overlay.className = 'preview-overlay';
    overlay.innerHTML = createPreviewModalHTML();
    document.body.appendChild(overlay);

    const { editor, updatePreview } = setupPreviewEditor(overlay, html);
    const chatInput = setupPreviewChat(overlay, editor, updatePreview);
    setupPreviewActions(overlay, editor);
    const cleanupResizer = setupPreviewResizer(overlay);
    const cleanupChatResizer = setupChatResizer(overlay);
    setupPreviewCloseHandlers(overlay, cleanupResizer, cleanupChatResizer);

    setTimeout(() => chatInput.focus(), 100);
}

function escapeHtml(s) {
    return String(s)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

function showFiles() {
    const parsed = state.last.parsed;
    if (!parsed || !parsed.files || parsed.files.length === 0) return;

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

    // Security: Use DOM methods instead of innerHTML
    const modal = document.createElement('div');
    modal.className = 'preview-modal files-modal';
    
    const header = document.createElement('div');
    header.className = 'preview-header';
    
    const title = document.createElement('span');
    title.className = 'preview-title';
    title.textContent = `📂 Alle genererte filer (${parsed.files.length})`;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'preview-btn preview-close';
    closeBtn.id = 'filesClose';
    closeBtn.title = 'Lukk';
    closeBtn.textContent = '✕';
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    const container = document.createElement('div');
    container.className = 'files-container';
    container.innerHTML = filesHtml; // filesHtml is already escaped via escapeHtml()
    
    modal.appendChild(header);
    modal.appendChild(container);
    overlay.appendChild(modal);

    document.body.appendChild(overlay);

    overlay.querySelectorAll('.copy-file-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const content = decodeURIComponent(escape(atob(btn.dataset.content)));
            navigator.clipboard.writeText(content);
            btn.textContent = '✓';
            setTimeout(() => btn.textContent = '📋', 1500);
        });
    });

    overlay.querySelector('#filesClose').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// ============================================
// PROJECT FILE GENERATORS
// ============================================

function extractCssFromHtml(html) {
    if (!html) return '';
    const styleBlocks = [];
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let match;
    while ((match = styleRegex.exec(html)) !== null) {
        styleBlocks.push(match[1].trim());
    }
    return styleBlocks.join('\n\n');
}

function extractJsFromHtml(html) {
    if (!html) return '';
    const scriptBlocks = [];
    const scriptRegex = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
        const content = match[1].trim();
        if (content) {
            scriptBlocks.push(content);
        }
    }
    return scriptBlocks.join('\n\n');
}

function generateCleanHtml(html, includeCssLink, includeJsLink) {
    if (!html) return html;
    let cleanHtml = html;

    if (includeCssLink) {
        cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        const linkTag = '<link rel="stylesheet" href="styles.css">';
        if (cleanHtml.includes('</head>')) {
            cleanHtml = cleanHtml.replace('</head>', `    ${linkTag}\n</head>`);
        }
    }

    if (includeJsLink) {
        cleanHtml = cleanHtml.replace(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi, '');
        const scriptTag = '<script src="script.js"></script>';
        if (cleanHtml.includes('</body>')) {
            cleanHtml = cleanHtml.replace('</body>', `    ${scriptTag}\n</body>`);
        }
    }

    cleanHtml = cleanHtml.replace(/\n\s*\n\s*\n/g, '\n\n');
    return cleanHtml;
}

function generateReadme() {
    const projectName = $('projectName').value || 'Mitt Prosjekt';
    const appType = $('promptAppType').value || '';
    const audience = $('promptAudience').value || '';
    const mainFeature = $('promptMainFeature').value || '';

    let description = `Et webprosjekt generert med Vibe Code Generator.`;
    if (appType) {
        description = `${appType}`;
        if (audience) description += ` for ${audience}`;
        if (mainFeature) description += `. Hovedfunksjon: ${mainFeature}`;
    }

    return `# ${projectName}

${description}

## Kom i gang

1. Åpne \`index.html\` i en nettleser
2. Eller bruk en lokal server: \`npx serve\`

## Prosjektstruktur

\`\`\`
${projectName.replace(/\s+/g, '-').toLowerCase()}/
├── index.html      # Hovedside
├── styles.css      # Stilark
├── script.js       # JavaScript
├── README.md       # Denne filen
├── LICENSE         # Lisens
└── assets/         # Bilder og ressurser
\`\`\`

## Teknologier

- HTML5
- CSS3
- JavaScript (Vanilla)

## Lisens

MIT License - se [LICENSE](LICENSE) for detaljer.

---
*Generert med [Vibe Code Generator](https://github.com/barx10/vibe_code_generator)*
`;
}

function generateGitignore() {
    return `# Dependencies
node_modules/
bower_components/

# Build output
dist/
build/
.cache/

# IDE and editors
.idea/
.vscode/
*.swp
*.swo
*~

# OS files
.DS_Store
Thumbs.db
desktop.ini

# Environment files
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*

# Temporary files
tmp/
temp/
*.tmp
`;
}

function generateLicense() {
    const year = new Date().getFullYear();
    const projectName = $('projectName').value || 'Prosjektet';

    return `MIT License

Copyright (c) ${year} ${projectName}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
}

// Store selected project files for download
state.projectFiles = {};

function showProjectTips() {
    const parsed = state.last.parsed;
    const html = parsed?.index_html || '';

    const extractedCss = extractCssFromHtml(html);
    const extractedJs = extractJsFromHtml(html);

    const projectFiles = [
        {
            id: 'styles',
            name: 'styles.css',
            icon: '🎨',
            description: 'Separert CSS-fil for bedre vedlikehold',
            canGenerate: !!extractedCss,
            content: extractedCss,
            previewLines: extractedCss ? extractedCss.split('\n').slice(0, 5).join('\n') + (extractedCss.split('\n').length > 5 ? '\n...' : '') : null
        },
        {
            id: 'script',
            name: 'script.js',
            icon: '⚡',
            description: 'Separert JavaScript-fil for funksjonalitet',
            canGenerate: !!extractedJs,
            content: extractedJs,
            previewLines: extractedJs ? extractedJs.split('\n').slice(0, 5).join('\n') + (extractedJs.split('\n').length > 5 ? '\n...' : '') : null
        },
        {
            id: 'readme',
            name: 'README.md',
            icon: '📖',
            description: 'Dokumentasjon om prosjektet ditt',
            canGenerate: true,
            generator: generateReadme
        },
        {
            id: 'gitignore',
            name: '.gitignore',
            icon: '🚫',
            description: 'Forteller Git hvilke filer som skal ignoreres',
            canGenerate: true,
            generator: generateGitignore
        },
        {
            id: 'license',
            name: 'LICENSE',
            icon: '📜',
            description: 'MIT-lisens for prosjektet',
            canGenerate: true,
            generator: generateLicense
        }
    ];

    // Reset project files state
    state.projectFiles = {};

    const overlay = document.createElement('div');
    overlay.className = 'preview-overlay';

    const modal = document.createElement('div');
    modal.className = 'preview-modal project-tips-modal';

    const header = document.createElement('div');
    header.className = 'preview-header';

    const title = document.createElement('span');
    title.className = 'preview-title';
    title.textContent = '📦 Generer prosjektfiler';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'preview-btn preview-close';
    closeBtn.title = 'Lukk';
    closeBtn.textContent = '✕';

    header.appendChild(title);
    header.appendChild(closeBtn);

    const intro = document.createElement('p');
    intro.className = 'project-tips-intro';
    intro.textContent = 'Velg hvilke filer du vil generere. CSS og JavaScript ekstraheres automatisk fra din kode:';

    const container = document.createElement('div');
    container.className = 'project-tips-container';

    projectFiles.forEach(file => {
        const item = document.createElement('div');
        item.className = 'project-tip-item' + (file.canGenerate ? ' can-generate' : ' cannot-generate');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `project-file-${file.id}`;
        checkbox.className = 'project-file-checkbox';
        checkbox.disabled = !file.canGenerate;
        checkbox.checked = file.canGenerate;

        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                const content = file.content || (file.generator ? file.generator() : '');
                state.projectFiles[file.id] = { name: file.name, content };
                item.classList.add('selected');
            } else {
                delete state.projectFiles[file.id];
                item.classList.remove('selected');
            }
            updateDownloadButton();
        });

        if (file.canGenerate) {
            const content = file.content || (file.generator ? file.generator() : '');
            state.projectFiles[file.id] = { name: file.name, content };
            item.classList.add('selected');
        }

        const label = document.createElement('label');
        label.htmlFor = `project-file-${file.id}`;
        label.className = 'project-tip-label';

        const headerDiv = document.createElement('div');
        headerDiv.className = 'project-tip-header';
        headerDiv.innerHTML = `
            <span class="project-tip-icon">${file.icon}</span>
            <span class="project-tip-name">${file.name}</span>
        `;

        const desc = document.createElement('p');
        desc.className = 'project-tip-desc';
        desc.textContent = file.description;

        label.appendChild(headerDiv);
        label.appendChild(desc);

        if (file.previewLines) {
            const preview = document.createElement('pre');
            preview.className = 'project-file-preview';
            preview.textContent = file.previewLines;
            label.appendChild(preview);
        }

        if (!file.canGenerate) {
            const noContent = document.createElement('p');
            noContent.className = 'project-tip-no-content';
            noContent.textContent = '⚠️ Ingen innhold å ekstrahere';
            label.appendChild(noContent);
        }

        item.appendChild(checkbox);
        item.appendChild(label);
        container.appendChild(item);
    });

    const actions = document.createElement('div');
    actions.className = 'project-tips-actions';

    const selectAllBtn = document.createElement('button');
    selectAllBtn.className = 'project-tips-btn secondary';
    selectAllBtn.textContent = 'Velg alle';
    selectAllBtn.addEventListener('click', () => {
        container.querySelectorAll('.project-file-checkbox:not(:disabled)').forEach(cb => {
            if (!cb.checked) {
                cb.checked = true;
                cb.dispatchEvent(new Event('change'));
            }
        });
    });

    const deselectAllBtn = document.createElement('button');
    deselectAllBtn.className = 'project-tips-btn secondary';
    deselectAllBtn.textContent = 'Fjern alle';
    deselectAllBtn.addEventListener('click', () => {
        container.querySelectorAll('.project-file-checkbox').forEach(cb => {
            if (cb.checked) {
                cb.checked = false;
                cb.dispatchEvent(new Event('change'));
            }
        });
    });

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'project-tips-btn primary';
    downloadBtn.id = 'downloadProjectFilesBtn';
    downloadBtn.innerHTML = '📥 Last ned prosjekt (.zip)';
    downloadBtn.addEventListener('click', async () => {
        await downloadProjectWithFiles();
        overlay.remove();
    });

    function updateDownloadButton() {
        const count = Object.keys(state.projectFiles).length;
        downloadBtn.disabled = count === 0;
        downloadBtn.innerHTML = count > 0
            ? `📥 Last ned prosjekt (${count + 1} filer)`
            : '📥 Velg minst én fil';
    }
    updateDownloadButton();

    actions.appendChild(selectAllBtn);
    actions.appendChild(deselectAllBtn);
    actions.appendChild(downloadBtn);

    modal.appendChild(header);
    modal.appendChild(intro);
    modal.appendChild(container);
    modal.appendChild(actions);
    overlay.appendChild(modal);

    document.body.appendChild(overlay);

    closeBtn.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    const escHandler = (e) => {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

async function downloadProjectWithFiles() {
    const parsed = state.last.parsed;
    if (!parsed) return;

    const projectName = $('projectName').value || 'prosjekt';
    const allFiles = [];

    // Check if we should modify the HTML
    const hasStyles = state.projectFiles.styles;
    const hasScript = state.projectFiles.script;

    if (parsed.index_html) {
        let htmlContent = parsed.index_html;
        if (hasStyles || hasScript) {
            htmlContent = generateCleanHtml(htmlContent, !!hasStyles, !!hasScript);
        }
        allFiles.push({ path: 'index.html', content: htmlContent });
    }

    // Add selected project files
    Object.values(state.projectFiles).forEach(file => {
        allFiles.push({ path: file.name, content: file.content });
    });

    // Add any other generated files
    if (parsed.files) {
        parsed.files.forEach(f => {
            if (!allFiles.some(af => af.path === f.path)) {
                allFiles.push(f);
            }
        });
    }

    if (!window.JSZip) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.integrity = 'sha512-XMVd28F1oH/O71fzwBnV7HucLxVwtxf26XV8P4wPk26EDxuGZ91N8bsOttmnomcCD3CS5ZMRL50H0GgOHvegtg==';
        script.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    const zip = new JSZip();
    allFiles.forEach(f => zip.file(f.path, f.content));

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

async function downloadAllFiles() {
    const parsed = state.last.parsed;
    if (!parsed) return;

    const projectName = $('projectName').value || 'prosjekt';
    const allFiles = [];

    if (parsed.index_html) {
        allFiles.push({ path: 'index.html', content: parsed.index_html });
    }
    if (parsed.files) {
        allFiles.push(...parsed.files);
    }

    if (!window.JSZip) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        // Security: Subresource Integrity to verify CDN content
        script.integrity = 'sha512-XMVd28F1oH/O71fzwBnV7HucLxVwtxf26XV8P4wPk26EDxuGZ91N8bsOttmnomcCD3CS5ZMRL50H0GgOHvegtg==';
        script.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    const zip = new JSZip();
    allFiles.forEach(f => zip.file(f.path, f.content));

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

function clearAll() {
    // Reset wizard to step 1
    goToStep(1);

    // Clear prompt inputs
    $('promptAppType').value = '';
    $('promptAudience').value = '';
    $('promptMainFeature').value = '';
    $('promptData').value = '';
    $('promptInteractions').value = '';
    $('promptOther').value = '';

    // Reset design to first option
    document.querySelector('input[name="designStyle"]').checked = true;

    // Clear output
    const outputEl = $('output');
    outputEl.textContent = '';
    outputEl.classList.add('empty');

    // Reset state
    state.last.raw = '';
    state.last.parsed = null;
    state.last.hasIndex = false;
    state.last.fileCount = 0;

    updateMetaDisplay();
    enableOutputActions(false);
    setStatus('', i18n[state.uiLang].statusReady);

    // Validate step buttons
    validateStep2();
}

function rememberKeyMaybe() {
    const mode = $('rememberKey').value;
    const key = $('apiKey').value;
    if (mode === 'local') {
        // Security: Show warning about localStorage risks
        const t = i18n[state.uiLang];
        const warningMsg = state.uiLang === 'no'
            ? '⚠️ ADVARSEL: Lagring av API-nøkler i nettleseren er ikke helt sikkert.\n\n' +
              'Risiko:\n• Browser-utvidelser kan lese nøkkelen\n• XSS-angrep kan stjele nøkkelen\n• Andre brukere på denne maskinen kan se den\n\n' +
              'Fortsett kun på din egen private maskin. Vil du lagre nøkkelen?'
            : '⚠️ WARNING: Storing API keys in browser is not fully secure.\n\n' +
              'Risks:\n• Browser extensions can read the key\n• XSS attacks can steal the key\n• Other users on this machine can see it\n\n' +
              'Only continue on your private machine. Save the key?';

        if (!confirm(warningMsg)) {
            $('rememberKey').value = 'none';
            return;
        }
        // Store obfuscated key (not encrypted, but prevents casual viewing)
        localStorage.setItem(STORAGE_KEY, obfuscateKey(key));
        // Remove old unobfuscated key if exists
        localStorage.removeItem('vibe_idea_builder_api_key');
    } else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('vibe_idea_builder_api_key'); // Clean up old format
    }
}

function loadRememberedKey() {
    // Try new obfuscated format first
    let saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        const key = deobfuscateKey(saved);
        if (key) {
            $('apiKey').value = key;
            $('rememberKey').value = 'local';
            validateStep1();
            return;
        }
    }
    // Fallback: migrate old unobfuscated key
    saved = localStorage.getItem('vibe_idea_builder_api_key');
    if (saved) {
        $('apiKey').value = saved;
        $('rememberKey').value = 'local';
        validateStep1();
        // Migrate to new format
        localStorage.setItem(STORAGE_KEY, obfuscateKey(saved));
        localStorage.removeItem('vibe_idea_builder_api_key');
    }
}

// ============================================
// LANGUAGE & TABS
// ============================================

function applyLang() {
    const t = i18n[state.uiLang];

    // Hero section
    $('heroBadge').textContent = t.heroBadge;
    $('heroTitle').innerHTML = t.heroTitle;
    $('heroSubtitle').textContent = t.heroSubtitle;
    $('heroFeature1').textContent = t.heroFeature1;
    $('heroFeature2').textContent = t.heroFeature2;
    $('heroFeature3').textContent = t.heroFeature3;

    // Language toggle - update active button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === state.uiLang);
    });

    // Tabs
    $('tabGen').textContent = t.generator;
    $('tabHelp').textContent = t.help;
    $('tabAbout').textContent = t.about;

    // Wizard steps
    $('wizardStep1Label').textContent = t.wizardStep1;
    $('wizardStep2Label').textContent = t.wizardStep2;
    $('wizardStep3Label').textContent = t.wizardStep3;

    // Step titles
    $('step1Title').textContent = t.step1Title;
    $('step1Desc').textContent = t.step1Desc;
    $('step2Title').textContent = t.step2Title;
    $('step2Desc').textContent = t.step2Desc;
    $('step3Title').textContent = t.step3Title;
    $('step3Desc').textContent = t.step3Desc;

    // Security section
    $('securityTitle').textContent = t.securityTitle;
    $('securityDesc').textContent = t.securityDesc;

    // Validation messages
    $('validationPendingText').textContent = t.validating;
    $('validationSuccessText').textContent = t.validSuccess;
    $('validationErrorText').textContent = t.validError;

    // API key label and placeholder
    $('lKey').textContent = t.apiKeyLabel;
    $('apiKey').placeholder = t.apiKeyPlaceholder;

    // Advanced settings
    $('advancedSettingsLabel').textContent = t.advancedSettings;
    $('lEndpoint').textContent = t.endpointLabel;
    $('lModel').textContent = t.modelLabel;
    $('lRemember').textContent = t.rememberKeyLabel;
    $('hRemember').textContent = t.rememberHint;
    $('lStack').textContent = t.technologyLabel;
    $('stackCustom').placeholder = t.techCustomPlaceholder;

    // Remember key options
    const rememberKeySelect = $('rememberKey');
    rememberKeySelect.options[0].textContent = t.rememberNo;
    rememberKeySelect.options[1].textContent = t.rememberLocal;

    // Stack options
    const stackSelect = $('stack');
    stackSelect.options[0].textContent = t.techHtmlCssJs;
    stackSelect.options[1].textContent = t.techTailwind;
    stackSelect.options[2].textContent = t.techReact;
    stackSelect.options[3].textContent = t.techCustom;

    // Model select optgroups and options
    const modelSelect = $('model');
    const optgroups = modelSelect.querySelectorAll('optgroup');
    if (optgroups[0]) optgroups[0].label = t.modelGeminiGroup;
    if (optgroups[1]) optgroups[1].label = t.modelOpenAIGroup;
    if (optgroups[2]) optgroups[2].label = t.modelClaudeGroup;
    if (optgroups[3]) optgroups[3].label = t.modelOtherGroup;

    // Update model option text
    const modelOptions = modelSelect.querySelectorAll('option');
    modelOptions.forEach(opt => {
        const val = opt.value;
        if (val === 'gemini-2.5-flash') opt.textContent = `Gemini 2.5 Flash (${t.modelGeminiFast})`;
        if (val === 'gemini-2.5-pro') opt.textContent = `Gemini 2.5 Pro (${t.modelGeminiPowerful})`;
        if (val === 'gemini-3-flash-preview') opt.textContent = `Gemini 3 Flash (${t.modelGeminiNewest})`;
        if (val === 'gemini-3-pro-preview') opt.textContent = `Gemini 3 Pro (${t.modelGeminiBest})`;
        if (val === 'gpt-4.1') opt.textContent = `GPT-4.1 (${t.modelSmart})`;
        if (val === 'gpt-5-mini') opt.textContent = `GPT-5 Mini (${t.modelFast})`;
        if (val === 'gpt-5-nano') opt.textContent = `GPT-5 Nano (${t.modelCheapest})`;
        if (val === 'gpt-5.2') opt.textContent = `GPT-5.2 (${t.modelBest})`;
        if (val === 'gpt-5.2-pro') opt.textContent = `GPT-5.2 Pro (${t.modelPremium})`;
        if (val === 'claude-opus-4-5-20250514') opt.textContent = `Claude Opus 4.5 (${t.modelBest})`;
        if (val === 'claude-haiku-4-5-20251001') opt.textContent = `Claude Haiku 4.5 (${t.modelFast})`;
        if (val === 'local-model') opt.textContent = t.modelLocal;
        if (val === 'custom') opt.textContent = t.modelCustom;
    });

    // Buttons
    $('step1NextBtn').querySelector('span').textContent = t.continueBtn;
    $('step2BackBtn').querySelector('span:last-child').textContent = t.backBtn;
    $('step2NextBtn').querySelector('span').textContent = t.generateBtn;
    $('step3BackBtn').querySelector('span:last-child').textContent = t.backBtn;
    $('btnRegenerate').querySelector('span').textContent = t.regenerateBtn;
    $('btnStartOver').querySelector('span').textContent = t.startOverBtn;

    // Prompt questions
    $('promptQ1Label').textContent = t.promptQ1;
    $('promptQ2Label').textContent = t.promptQ2;
    $('promptQ3Label').textContent = t.promptQ3;
    $('promptQ4Label').textContent = t.promptQ4;
    $('promptQ5Label').textContent = t.promptQ5;
    $('promptQ6Label').textContent = t.promptQ6;
    $('promptQ7Label').textContent = t.promptQ7;

    // Placeholders
    $('promptAppType').placeholder = t.placeholderAppType;
    $('promptAudience').placeholder = t.placeholderAudience;
    $('promptMainFeature').placeholder = t.placeholderMainFeature;
    $('promptData').placeholder = t.placeholderData;
    $('promptInteractions').placeholder = t.placeholderInteractions;
    $('promptOther').placeholder = t.placeholderOther;

    // Suggestion chips
    const chips = document.querySelectorAll('.suggestion-chip');
    const chipTexts = [t.chipQuiz, t.chipTodo, t.chipCalculator, t.chipPortfolio, t.chipBudget, t.chipWeather];
    chips.forEach((chip, i) => {
        if (chipTexts[i]) chip.textContent = chipTexts[i];
    });

    // Design options
    const designNames = document.querySelectorAll('.design-name');
    const designTexts = [t.designModern, t.designGamer, t.designColorful, t.designProfessional, t.designDark, t.designGradient];
    designNames.forEach((el, i) => {
        if (designTexts[i]) el.textContent = designTexts[i];
    });

    // Prompt tip
    $('promptQ3Hint').innerHTML = t.promptTip;

    // AI improvement section
    $('aiImproveTitle').textContent = t.aiImproveTitle;
    $('aiImproveDesc').textContent = t.aiImproveDesc;
    $('aiImproveBtn').querySelector('span').textContent = t.aiImproveBtn;
    $('aiPreviewLoading').querySelector('span:last-child').textContent = t.aiImproving;
    $('aiPreviewLabel').textContent = t.aiVersion;
    $('aiDiscardBtn').textContent = t.aiDiscard;
    $('aiApplyBtn').textContent = t.aiApply;

    // Prompt preview
    $('promptPreviewTitle').textContent = t.promptPreviewTitle;
    $('togglePromptText').textContent = t.showPreview;

    // Output section
    $('tOut').textContent = t.output;
    $('btnPreview').textContent = t.preview;
    $('btnCopy').textContent = t.copy;
    $('btnDownload').textContent = t.download;
    $('btnDownloadAll').textContent = t.downloadZip;
    $('btnShowFiles').textContent = t.showFiles;
    $('btnProjectTips').textContent = t.projectTips;
    $('noteKey').textContent = t.noteKey;
    $('progressText').textContent = t.progressStarting;

    // Refine section
    $('refineTitle').textContent = t.refineTitle;
    $('refineDesc').textContent = t.refineDesc;
    $('refineInput').placeholder = t.refinePlaceholder;
    $('btnRefine').querySelector('span').textContent = t.refineBtn;
    $('refineLoadingText').textContent = t.refineLoading;

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

// ============================================
// EVENT LISTENERS
// ============================================

function initEventListeners() {
    // Language toggle
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.uiLang = btn.dataset.lang;
            applyLang();
        });
    });

    // Tabs
    $('tabGen').addEventListener('click', () => tabTo('gen'));
    $('tabHelp').addEventListener('click', () => tabTo('help'));
    $('tabAbout').addEventListener('click', () => tabTo('about'));

    // Provider selection
    document.querySelectorAll('.provider-btn').forEach(btn => {
        btn.addEventListener('click', () => selectProvider(btn.dataset.provider));
    });

    // API key input
    $('apiKey').addEventListener('input', () => {
        validateStep1();
        setApiState();
    });

    // Toggle key visibility
    $('toggleKeyVisibility').addEventListener('click', () => {
        const input = $('apiKey');
        const btn = $('toggleKeyVisibility');
        if (input.type === 'password') {
            input.type = 'text';
            btn.textContent = '🙈';
        } else {
            input.type = 'password';
            btn.textContent = '👁️';
        }
    });

    // Model change updates endpoint
    $('model').addEventListener('change', (e) => {
        const endpoint = getEndpointForModel(e.target.value);
        if (endpoint) {
            $('endpoint').value = endpoint;
        }
    });

    // Stack custom input
    $('stack').addEventListener('change', (e) => {
        $('stackCustom').classList.toggle('hidden', e.target.value !== 'custom');
    });

    // Step 1 Next button
    $('step1NextBtn').addEventListener('click', () => {
        if (state.apiValidated) {
            rememberKeyMaybe();
            goToStep(2);
        }
    });

    // Step 2 inputs
    $('promptAppType').addEventListener('input', validateStep2);
    $('promptMainFeature').addEventListener('input', validateStep2);
    $('promptAudience').addEventListener('input', updatePromptPreview);
    $('promptData').addEventListener('input', updatePromptPreview);
    $('promptInteractions').addEventListener('input', updatePromptPreview);
    $('promptOther').addEventListener('input', updatePromptPreview);

    document.querySelectorAll('input[name="designStyle"]').forEach(input => {
        input.addEventListener('change', updatePromptPreview);
    });

    // Suggestion chips
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            $('promptAppType').value = chip.dataset.value;
            validateStep2();
        });
    });

    // AI improve buttons
    $('aiImproveBtn').addEventListener('click', () => {
        improvePromptWithAI();
    });

    $('aiApplyBtn').addEventListener('click', () => {
        applyAIImprovement();
    });

    $('aiDiscardBtn').addEventListener('click', () => {
        discardAIImprovement();
    });

    // Toggle prompt preview
    $('togglePromptPreview').addEventListener('click', () => {
        const content = $('promptPreviewContent');
        const btn = $('togglePromptPreview');
        const text = $('togglePromptText');
        const t = i18n[state.uiLang];

        content.classList.toggle('hidden');
        btn.classList.toggle('open');
        text.textContent = content.classList.contains('hidden') ? t.showPreview : t.hidePreview;
    });

    // Step 2 Back button
    $('step2BackBtn').addEventListener('click', () => goToStep(1));

    // Step 2 Next (Generate) button
    $('step2NextBtn').addEventListener('click', async () => {
        updatePromptPreview();
        goToStep(3);
        await callModel();
    });

    // Step 3 buttons
    $('step3BackBtn').addEventListener('click', () => goToStep(2));
    $('btnRegenerate').addEventListener('click', () => callModel());
    $('btnStartOver').addEventListener('click', clearAll);

    // Output actions
    $('btnCopy').addEventListener('click', copyOutput);
    $('btnDownload').addEventListener('click', downloadIndex);
    $('btnDownloadAll').addEventListener('click', downloadAllFiles);
    $('btnPreview').addEventListener('click', openPreview);
    $('btnShowFiles').addEventListener('click', showFiles);
    $('btnProjectTips').addEventListener('click', showProjectTips);

    // Refine output
    $('refineInput').addEventListener('input', () => {
        const hasText = $('refineInput').value.trim().length > 0;
        $('btnRefine').disabled = !hasText;
    });
    $('btnRefine').addEventListener('click', refineOutput);
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Always start at top of page
    window.scrollTo(0, 0);

    initEventListeners();
    loadRememberedKey();
    applyLang();
    goToStep(1, true); // skipScroll = true on initial load
    validateStep2();
    setStatus('', i18n[state.uiLang].statusReady);
});
