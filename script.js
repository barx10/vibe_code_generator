const $ = (id) => document.getElementById(id);

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

const modelConfig = {
    // OpenAI
    'gpt-4.1': 'https://api.openai.com/v1/chat/completions',
    'gpt-5-mini': 'https://api.openai.com/v1/chat/completions',
    'gpt-5.2': 'https://api.openai.com/v1/chat/completions',
    'gpt-5.2-pro': 'https://api.openai.com/v1/chat/completions',
    'gpt-5-nano': 'https://api.openai.com/v1/chat/completions',
    // Anthropic (Claude) - direkte
    'claude-sonnet-4-5-20250514': 'https://api.anthropic.com/v1/messages',
    'claude-opus-4-5-20250514': 'https://api.anthropic.com/v1/messages',
    'claude-haiku-4-5-20251001': 'https://api.anthropic.com/v1/messages',
    // Google Gemini
    'gemini-2.5-flash': 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    'gemini-2.5-pro': 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    'gemini-2.0-flash': 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    'gemini-3-flash-preview': 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    'gemini-3-pro-preview': 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    // Local
    'local-model': 'http://localhost:1234/v1/chat/completions'
};

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
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                temperature,
                max_tokens: maxTokens,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ]
            })
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
        toggle: 'Bytt',
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
        statusNeedKey: 'mangler API key',
        statusCalling: 'kaller modell',
        statusDone: 'ferdig',
        statusFail: 'feil',
        outNone: 'ingen',
        preview: '👁️ Preview',
        copy: '📋 Kopier',
        download: '💾 Last ned',
        downloadZip: '📦 Last ned ZIP',
        showFiles: '📂 Vis filer',
        noteKey: 'Tips: legg aldri API key i generert kode'
    },
    en: {
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
        outNone: 'none',
        preview: '👁️ Preview',
        copy: '📋 Copy',
        download: '💾 Download',
        downloadZip: '📦 Download ZIP',
        showFiles: '📂 Show files',
        noteKey: 'Tip: never put API keys in generated code'
    }
};

// ============================================
// WIZARD NAVIGATION
// ============================================

function goToStep(step) {
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

    // Scroll to top of wizard
    document.querySelector('.wizard-steps')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function validateStep1() {
    const apiKey = $('apiKey').value.trim();
    const provider = state.selectedProvider;
    const config = providerConfig[provider];

    if (!apiKey) {
        state.apiValidated = false;
        $('step1NextBtn').disabled = true;
        hideAllValidation();
        return;
    }

    // Check prefix
    if (config.prefix && !apiKey.startsWith(config.prefix)) {
        showValidationError();
        state.apiValidated = false;
        $('step1NextBtn').disabled = true;
        return;
    }

    // Show success (we'll do real validation on generate)
    showValidationSuccess();
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

function hideAllValidation() {
    $('validationPending').classList.add('hidden');
    $('validationSuccess').classList.add('hidden');
    $('validationError').classList.add('hidden');
}

function showValidationPending() {
    hideAllValidation();
    $('validationPending').classList.remove('hidden');
}

function showValidationSuccess() {
    hideAllValidation();
    $('validationSuccess').classList.remove('hidden');
}

function showValidationError() {
    hideAllValidation();
    $('validationError').classList.remove('hidden');
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

    prompt += lang === 'no' ? '🎨 DESIGN & UI/UX:\n' : '🎨 DESIGN & UI/UX:\n';
    prompt += `${style}\n`;
    prompt += lang === 'no'
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
        ? `Du er en ekspert på å forbedre app-beskrivelser. Ta brukerens beskrivelse og gjør den mer detaljert og profesjonell. Legg til spesifikke UI/UX-detaljer, animasjoner, og funksjoner som ville gjøre appen fantastisk. Behold strukturen men utvid med kreative forslag. Svar KUN med den forbedrede beskrivelsen, ingen annen tekst.`
        : `You are an expert at improving app descriptions. Take the user's description and make it more detailed and professional. Add specific UI/UX details, animations, and features that would make the app amazing. Keep the structure but expand with creative suggestions. Reply ONLY with the improved description, no other text.`;

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
            console.error('AI improve error:', errorText);
            $('aiImprovePreview').classList.add('hidden');
            alert(state.uiLang === 'no' ? 'Kunne ikke forbedre prompten. Sjekk API-nøkkelen.' : 'Could not improve prompt. Check API key.');
        }
    } catch (e) {
        console.error('AI improve error:', e);
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

function updateProgress(percent, text) {
    $('progressFill').style.width = percent + '%';
    $('progressText').textContent = text;

    const icons = ['⚡', '🔗', '📤', '🧠', '📥', '🔧', '✅'];
    const iconIndex = Math.min(Math.floor(percent / 15), icons.length - 1);
    $('progressIcon').textContent = icons[iconIndex];
}

function setApiState() {
    const key = $('apiKey').value.trim();
    $('apiState').textContent = key ? 'ok' : i18n[state.uiLang].statusNeedKey;
    $('apiState').className = 'status-badge ' + (key ? 'success' : 'error');
}

function buildPrompt() {
    const outLang = 'no';

    let stackValue = $('stack').value;
    if (stackValue === 'custom') {
        stackValue = $('stackCustom').value.trim() || 'html-css-js';
    }

    const spec = {
        project_name: $('projectName').value.trim() || 'min-app',
        goal: $('goal').value.trim(),
        stack: stackValue,
        output_language: outLang,
        output_mode: 'single'
    };

    const stackGuide = {
        'react': `\n**REACT-SPESIFIKT:**
- Bruk React 18+ med ESM imports fra esm.sh
- Inkluder createRoot fra react-dom/client
- Bruk hooks (useState, useEffect, etc.)
- Koden MÅ kjøre direkte i nettleseren uten npm/build`
    };

    const stackInstructions = stackGuide[stackValue] || '';

    const sys = `Du er en ekspert fullstack-utvikler som lager FUNGERENDE, startklare prosjekter. Koden må faktisk kjøre - ikke teoretiske eksempler.

KRITISKE REGLER:
1. **FUNKSJONALITET FØRST:** Koden MÅ kjøre uten feil
2. **KOMPLETT IMPLEMENTASJON:** Alle features i goal må være implementert
3. **INGEN EKSTERNE AVHENGIGHETER SOM KREVER BUILD:** Bruk CDN eller ESM imports
4. **REALISTISKE EKSEMPELDATA:** Inkluder faktiske eksempler
5. **FEILHÅNDTERING:** Legg til try/catch og brukervenlige feilmeldinger${stackInstructions}

DESIGN-KRAV:
- Mørk, moderne fargeprofil (dark mode) som standard
- Subtile gradienter, shadows og hover-effekter
- Smooth CSS-animasjoner og transitions
- Google Fonts (Inter, Outfit, eller lignende)
- Responsivt design (CSS Grid/Flexbox)
- Visuelt tiltalende header/hero-seksjon
- Loading states og micro-interactions
- CSS custom properties (variabler)`;

    const format = `Svar kun som JSON. Schema:
{
  "index_html": "...",
  "files": [],
  "notes": "kort, valgfritt"
}

VIKTIGE REGLER:
1) **index_html må være komplett og KJØRBAR**
2) **Ingen API keys eller hemmeligheter i kode**
3) **Bruk faktiske, fungerende eksempeldata**
4) **Single mode:** Legg ALL CSS og JS inline i index_html. files skal være tom liste []

STIL-REGLER:
- Bakgrunn: mørk (#0a0a0f eller #0f172a)
- Primærfarge: livlig accent (#38bdf8, #8b5cf6, eller lignende)
- Tekst: #f1f5f9 på mørk bakgrunn
- Kort/paneler: rgba(30, 41, 59, 0.6) med border
- Knapper: solid farge eller gradient med hover-glow
- Animasjoner: fadeIn, subtle hover transforms, smooth transitions`;

    const user = `Spesifikasjon:\n${JSON.stringify(spec, null, 2)}\n\n${format}\n\nLag et FUNGERENDE prosjekt som matcher dette. KRITISK: Koden må faktisk kjøre!`;

    return { sys, user };
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

    } catch (e) {
        if (progressInterval) clearInterval(progressInterval);
        renderOutput(String(e));
        showProgress(false);
        setStatus('bad', t.statusFail);
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

function openPreview() {
    const parsed = state.last.parsed;
    const html = (parsed && parsed.index_html) ? parsed.index_html : ($('output').textContent || '');

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

    overlay.querySelector('#previewClose').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('#previewNewTab').addEventListener('click', () => {
        const w = window.open('', '_blank');
        if (w) {
            w.document.open();
            w.document.write(html);
            w.document.close();
        }
    });

    const escHandler = (e) => {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
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

    overlay.innerHTML = `
        <div class="preview-modal files-modal">
            <div class="preview-header">
                <span class="preview-title">📂 Alle genererte filer (${parsed.files.length})</span>
                <button class="preview-btn preview-close" id="filesClose" title="Lukk">✕</button>
            </div>
            <div class="files-container">${filesHtml}</div>
        </div>
    `;

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
        validateStep1();
    }
}

// ============================================
// LANGUAGE & TABS
// ============================================

function applyLang() {
    const t = i18n[state.uiLang];

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

    $('wizardStep1Label').textContent = t.wizardStep1;
    $('wizardStep2Label').textContent = t.wizardStep2;
    $('wizardStep3Label').textContent = t.wizardStep3;

    $('step1Title').textContent = t.step1Title;
    $('step1Desc').textContent = t.step1Desc;
    $('step2Title').textContent = t.step2Title;
    $('step2Desc').textContent = t.step2Desc;
    $('step3Title').textContent = t.step3Title;
    $('step3Desc').textContent = t.step3Desc;

    $('securityTitle').textContent = t.securityTitle;
    $('securityDesc').textContent = t.securityDesc;

    $('validationPendingText').textContent = t.validating;
    $('validationSuccessText').textContent = t.validSuccess;
    $('validationErrorText').textContent = t.validError;

    $('promptQ1Label').textContent = t.promptQ1;
    $('promptQ2Label').textContent = t.promptQ2;
    $('promptQ3Label').textContent = t.promptQ3;
    $('promptQ4Label').textContent = t.promptQ4;
    $('promptQ5Label').textContent = t.promptQ5;
    $('promptQ6Label').textContent = t.promptQ6;
    $('promptQ7Label').textContent = t.promptQ7;

    $('aiImproveTitle').textContent = t.aiImproveTitle;
    $('aiImproveDesc').textContent = t.aiImproveDesc;

    $('promptPreviewTitle').textContent = t.promptPreviewTitle;
    $('togglePromptText').textContent = t.showPreview;

    $('noteKey').textContent = t.noteKey;

    $('langPill').querySelector('.mono').textContent = state.uiLang.toUpperCase();

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
    $('toggleLang').addEventListener('click', () => {
        state.uiLang = state.uiLang === 'no' ? 'en' : 'no';
        applyLang();
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
        const val = e.target.value;
        if (modelConfig[val]) {
            $('endpoint').value = modelConfig[val];
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
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    loadRememberedKey();
    applyLang();
    goToStep(1);
    validateStep2();
    setStatus('', i18n[state.uiLang].statusReady);
});
