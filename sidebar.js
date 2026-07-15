/**
 * MCQ AI — Sidebar Application Logic
 * State management, API routing, and UI rendering.
 */

const api = typeof browser !== 'undefined' ? browser : chrome;

// ═══════════════════════════════════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════════════════════════════════

const state = {
  status: 'idle', // idle | capturing | loading | answer | error
  answer: null,
  explanation: null,
  errorMessage: null,
  settingsOpen: false,
  provider: 'gemini',
  settings: {
    gemini: { key: '', model: 'gemini-2.0-flash' },
    openrouter: { key: '', model: 'google/gemini-flash-1.5' },
    custom: { url: '', key: '', model: '', headers: '' },
    ollama: { url: 'http://localhost:11434', model: 'llama3.2-vision' }
  }
};


// ═══════════════════════════════════════════════════════════════════════════
// DOM References
// ═══════════════════════════════════════════════════════════════════════════

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
  btnCapture:       $('#btn-capture'),
  btnCaptureText:   $('.btn-capture-text'),
  btnSettings:      $('#btn-settings'),
  btnCloseSettings: $('#btn-close-settings'),
  btnSave:          $('#btn-save-settings'),
  btnRetry:         $('#btn-retry'),
  btnAccordion:     $('#btn-accordion'),
  btnFetchGeminiModels: $('#btn-fetch-gemini-models'),

  stateEmpty:    $('#state-empty'),
  stateLoading:  $('#state-loading'),
  stateAnswer:   $('#state-answer'),
  stateError:    $('#state-error'),

  answerText:      $('#answer-text'),
  explanationText: $('#explanation-text'),
  errorMessage:    $('#error-message'),
  accordion:       $('#accordion'),

  settingsPanel:   $('#settings-panel'),
  settingsOverlay: $('#settings-overlay'),
  saveToast:       $('#save-toast'),

  providerName: $('#provider-name'),
  providerDot:  $('.provider-dot'),

  providerBtns: $$('.provider-btn'),

  // Settings inputs
  geminiKey:       $('#gemini-key'),
  geminiModel:     $('#gemini-model'),
  openrouterKey:   $('#openrouter-key'),
  openrouterModel: $('#openrouter-model'),
  customUrl:       $('#custom-url'),
  customKey:       $('#custom-key'),
  customModel:     $('#custom-model'),
  customHeaders:   $('#custom-headers'),
  ollamaUrl:       $('#ollama-url'),
  ollamaModel:     $('#ollama-model'),

  // Settings sections
  settingsGemini:     $('#settings-gemini'),
  settingsOpenrouter: $('#settings-openrouter'),
  settingsCustom:     $('#settings-custom'),
  settingsOllama:     $('#settings-ollama'),
};


// ═══════════════════════════════════════════════════════════════════════════
// UI Rendering
// ═══════════════════════════════════════════════════════════════════════════

function render() {
  // Hide all state cards
  dom.stateEmpty.classList.add('hidden');
  dom.stateLoading.classList.add('hidden');
  dom.stateAnswer.classList.add('hidden');
  dom.stateError.classList.add('hidden');

  // Reset capture button
  dom.btnCapture.disabled = false;
  dom.btnCapture.classList.remove('idle');
  dom.btnCaptureText.textContent = 'Capture & Solve';

  switch (state.status) {
    case 'idle':
      dom.stateEmpty.classList.remove('hidden');
      dom.btnCapture.classList.add('idle');
      break;

    case 'capturing':
      dom.stateLoading.classList.remove('hidden');
      dom.btnCapture.disabled = true;
      dom.btnCaptureText.textContent = 'Capturing...';
      break;

    case 'loading':
      dom.stateLoading.classList.remove('hidden');
      dom.btnCapture.disabled = true;
      dom.btnCaptureText.textContent = 'Analyzing...';
      break;

    case 'answer':
      dom.stateAnswer.classList.remove('hidden');
      dom.answerText.textContent = state.answer || '';
      dom.explanationText.textContent = state.explanation || '';
      // Reset accordion
      dom.accordion.classList.remove('open');
      break;

    case 'error':
      dom.stateError.classList.remove('hidden');
      dom.errorMessage.textContent = state.errorMessage || 'Something went wrong';
      break;
  }

  // Update provider footer
  updateProviderFooter();
}

function updateProviderFooter() {
  const providerConfig = state.settings[state.provider];
  let hasKey;

  if (state.provider === 'ollama') {
    hasKey = !!providerConfig.url;
  } else if (state.provider === 'custom') {
    hasKey = providerConfig.url && providerConfig.key;
  } else {
    hasKey = !!providerConfig.key;
  }

  const names = {
    gemini: 'Gemini',
    openrouter: 'OpenRouter',
    custom: 'Custom Endpoint',
    ollama: 'Ollama'
  };

  if (hasKey) {
    dom.providerDot.classList.add('active');
    if (state.provider === 'ollama') {
      dom.providerName.textContent = `${names[state.provider]} · Local (${providerConfig.model})`;
    } else {
      dom.providerName.textContent = `${names[state.provider]} · Ready`;
    }
  } else {
    dom.providerDot.classList.remove('active');
    dom.providerName.textContent = 'No provider configured';
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// Settings Panel
// ═══════════════════════════════════════════════════════════════════════════

function openSettings() {
  state.settingsOpen = true;
  dom.settingsOverlay.classList.remove('hidden');
  // Force reflow before adding visible class for transition
  dom.settingsOverlay.offsetHeight;
  dom.settingsOverlay.classList.add('visible');
  dom.settingsPanel.classList.add('open');
  populateSettingsUI();
}

function closeSettings() {
  state.settingsOpen = false;
  dom.settingsOverlay.classList.remove('visible');
  dom.settingsPanel.classList.remove('open');
  setTimeout(() => {
    dom.settingsOverlay.classList.add('hidden');
  }, 400); // Wait for slide animation
}

function populateSettingsUI() {
  // Highlight active provider button
  dom.providerBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.provider === state.provider);
  });

  // Show correct settings section
  dom.settingsGemini.classList.toggle('hidden', state.provider !== 'gemini');
  dom.settingsOpenrouter.classList.toggle('hidden', state.provider !== 'openrouter');
  dom.settingsCustom.classList.toggle('hidden', state.provider !== 'custom');
  dom.settingsOllama.classList.toggle('hidden', state.provider !== 'ollama');

  // Fill input values
  dom.geminiKey.value = state.settings.gemini.key;
  dom.geminiModel.value = state.settings.gemini.model;
  dom.openrouterKey.value = state.settings.openrouter.key;
  dom.openrouterModel.value = state.settings.openrouter.model;
  dom.customUrl.value = state.settings.custom.url;
  dom.customKey.value = state.settings.custom.key;
  dom.customModel.value = state.settings.custom.model;
  dom.customHeaders.value = state.settings.custom.headers;
  dom.ollamaUrl.value = state.settings.ollama.url;
  dom.ollamaModel.value = state.settings.ollama.model;
}

function selectProvider(provider) {
  state.provider = provider;
  populateSettingsUI();
}

async function saveSettings() {
  // Read values from UI
  state.settings.gemini.key = dom.geminiKey.value.trim();
  state.settings.gemini.model = dom.geminiModel.value;
  state.settings.openrouter.key = dom.openrouterKey.value.trim();
  state.settings.openrouter.model = dom.openrouterModel.value.trim();
  state.settings.custom.url = dom.customUrl.value.trim();
  state.settings.custom.key = dom.customKey.value.trim();
  state.settings.custom.model = dom.customModel.value.trim();
  state.settings.custom.headers = dom.customHeaders.value.trim();
  state.settings.ollama.url = dom.ollamaUrl.value.trim();
  state.settings.ollama.model = dom.ollamaModel.value.trim();

  // Persist to storage
  try {
    await api.storage.local.set({
      provider: state.provider,
      settings: state.settings
    });
  } catch (e) {
    console.error('[MCQ AI] Failed to save settings:', e);
  }

  // Show toast
  dom.saveToast.classList.remove('hidden');
  setTimeout(() => {
    dom.saveToast.classList.add('hidden');
  }, 2000);

  updateProviderFooter();
}

async function loadSettings() {
  try {
    const data = await api.storage.local.get(['provider', 'settings']);
    if (data.provider) state.provider = data.provider;
    if (data.settings) {
      // Merge to handle added fields in updates
      Object.keys(data.settings).forEach(key => {
        if (state.settings[key]) {
          Object.assign(state.settings[key], data.settings[key]);
        }
      });
    }
  } catch (e) {
    console.error('[MCQ AI] Failed to load settings:', e);
  }
}

async function fetchGeminiModels() {
  const key = dom.geminiKey.value.trim();
  if (!key) {
    alert('Please enter a Gemini API key first to fetch models.');
    return;
  }
  
  const originalText = dom.btnFetchGeminiModels.textContent;
  dom.btnFetchGeminiModels.textContent = '⏳ Fetching...';
  dom.btnFetchGeminiModels.disabled = true;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    const res = await fetchViaBackground(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) {
      const errMessage = res.body?.error?.message || `API error (${res.status})`;
      throw new Error(errMessage);
    }

    const data = res.body;
    if (!data.models || data.models.length === 0) {
      throw new Error('No models found.');
    }

    // Filter models that support generateContent and start with models/gemini
    const validModels = data.models.filter(m => 
      m.name.startsWith('models/gemini') &&
      m.supportedGenerationMethods?.includes('generateContent')
    );

    if (validModels.length === 0) {
      throw new Error('No compatible models found for this key.');
    }

    // Store the currently selected model to preserve it if possible
    const currentSelected = dom.geminiModel.value;

    // Clear and populate the select element
    dom.geminiModel.innerHTML = '';
    
    // Sort models putting newer/pro models first heuristically
    validModels.sort((a, b) => b.name.localeCompare(a.name));

    let foundCurrent = false;
    validModels.forEach(m => {
      // API returns "models/gemini-pro", we only want "gemini-pro"
      const modelId = m.name.replace('models/', '');
      const option = document.createElement('option');
      option.value = modelId;
      option.textContent = m.displayName || modelId;
      dom.geminiModel.appendChild(option);
      
      if (modelId === currentSelected) {
        foundCurrent = true;
      }
    });

    // Restore selection or select first
    if (foundCurrent) {
      dom.geminiModel.value = currentSelected;
    } else {
      dom.geminiModel.selectedIndex = 0;
    }

    dom.btnFetchGeminiModels.textContent = '✅ Updated';
    setTimeout(() => {
      dom.btnFetchGeminiModels.textContent = originalText;
    }, 2000);

  } catch (err) {
    console.error('[MCQ AI] Failed to fetch Gemini models:', err);
    alert(`Failed to fetch models: ${err.message}`);
    dom.btnFetchGeminiModels.textContent = '❌ Failed';
    setTimeout(() => {
      dom.btnFetchGeminiModels.textContent = originalText;
    }, 2000);
  } finally {
    dom.btnFetchGeminiModels.disabled = false;
  }
}



// ═══════════════════════════════════════════════════════════════════════════
// Capture & Solve
// ═══════════════════════════════════════════════════════════════════════════

async function captureAndSolve() {
  // Validate provider config
  const config = state.settings[state.provider];
  if (state.provider === 'custom') {
    if (!config.url || !config.key) {
      showError('Please configure your Custom endpoint URL and API key in Settings.');
      return;
    }
  } else if (state.provider === 'ollama') {
    if (!config.url) {
      showError('Please configure your Ollama server URL in Settings.');
      return;
    }
  } else if (!config.key) {
    const name = state.provider === 'gemini' ? 'Gemini' : 'OpenRouter';
    showError(`Please add your ${name} API key in Settings.`);
    return;
  }

  // Step 1: Capture screen
  state.status = 'capturing';
  render();

  let dataUrl;
  try {
    const response = await api.runtime.sendMessage({ action: 'captureScreen' });
    if (response.error) throw new Error(response.error);
    dataUrl = response.dataUrl;
  } catch (err) {
    showError(`Capture failed: ${err.message}`);
    return;
  }

  // Step 2: Send to AI
  state.status = 'loading';
  render();

  try {
    const result = await sendToAI(dataUrl);
    state.answer = result.answer;
    state.explanation = result.explanation;
    state.status = 'answer';
  } catch (err) {
    showError(`AI request failed: ${err.message}`);
    return;
  }

  render();
}

function showError(message) {
  state.status = 'error';
  state.errorMessage = message;
  render();
}


// ═══════════════════════════════════════════════════════════════════════════
// API Router
// ═══════════════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are an expert exam solver. Analyze the provided image of a multiple-choice question. Determine the correct answer. 
Your output must strictly follow this JSON format:
{
  "answer": "The exact text of the correct option (do not just write 'Option A', write the actual answer content)",
  "explanation": "A concise, step-by-step breakdown of why this answer is correct."
}
Return ONLY valid JSON, no markdown code fences, no extra text.`;

async function sendToAI(dataUrl) {
  // Extract base64 data from data URL
  const base64Data = dataUrl.split(',')[1];
  const mimeType = dataUrl.split(';')[0].split(':')[1] || 'image/png';

  switch (state.provider) {
    case 'gemini':
      return sendToGemini(base64Data, mimeType);
    case 'openrouter':
      return sendToOpenRouter(dataUrl);
    case 'custom':
      return sendToCustom(dataUrl);
    case 'ollama':
      return sendToOllama(dataUrl);
    default:
      throw new Error('Unknown provider');
  }
}

async function fetchViaBackground(url, options) {
  const res = await api.runtime.sendMessage({
    action: 'apiFetch',
    requestData: { url, options }
  });
  if (res.error) {
    throw new Error(res.error);
  }
  return res;
}

async function sendToGemini(base64Data, mimeType) {
  const config = state.settings.gemini;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.key}`;

  const body = {
    contents: [{
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        },
        {
          text: SYSTEM_PROMPT
        }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: 1024
    }
  };

  const res = await fetchViaBackground(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errMessage = res.body?.error?.message || `Gemini API error (${res.status})`;
    throw new Error(errMessage);
  }

  const data = res.body;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');

  return parseAIResponse(text);
}

async function sendToOpenRouter(dataUrl) {
  const config = state.settings.openrouter;
  const url = 'https://openrouter.ai/api/v1/chat/completions';

  const body = {
    model: config.model,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: { url: dataUrl }
        },
        {
          type: 'text',
          text: SYSTEM_PROMPT
        }
      ]
    }],
    temperature: 0.1,
    max_tokens: 1024
  };

  const cleanKey = config.key.trim();
  const authHeader = cleanKey.toLowerCase().startsWith('bearer ') ? cleanKey : `Bearer ${cleanKey}`;

  console.log('[MCQ AI] Sending request to OpenRouter. Model:', config.model);

  const res = await fetchViaBackground(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    console.error('[MCQ AI] OpenRouter error details:', res.body);
    const errMessage = res.body?.error?.message || `OpenRouter API error (${res.status})`;
    throw new Error(errMessage);
  }

  const data = res.body;
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from OpenRouter');

  return parseAIResponse(text);
}

async function sendToCustom(dataUrl) {
  const config = state.settings.custom;
  let baseUrl = config.url.replace(/\/+$/, '');
  if (!baseUrl.endsWith('/chat/completions')) {
    baseUrl += '/chat/completions';
  }

  const body = {
    model: config.model,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: { url: dataUrl }
        },
        {
          type: 'text',
          text: SYSTEM_PROMPT
        }
      ]
    }],
    temperature: 0.1,
    max_tokens: 1024
  };

  // Parse custom headers
  let customHeaders = {};
  if (config.headers) {
    try {
      customHeaders = JSON.parse(config.headers);
    } catch {
      console.warn('[MCQ AI] Invalid custom headers JSON, ignoring.');
    }
  }

  const cleanKey = config.key.trim();
  const authHeader = cleanKey.toLowerCase().startsWith('bearer ') ? cleanKey : `Bearer ${cleanKey}`;

  console.log('[MCQ AI] Sending request to Custom Endpoint:', baseUrl);

  const res = await fetchViaBackground(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
      ...customHeaders
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    console.error('[MCQ AI] Custom Endpoint error details:', res.body);
    const errMessage = res.body?.error?.message || `Custom API error (${res.status})`;
    throw new Error(errMessage);
  }

  const data = res.body;
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from custom endpoint');

  return parseAIResponse(text);
}

async function sendToOllama(dataUrl) {
  const config = state.settings.ollama;
  const url = `${config.url.replace(/\/+$/, '')}/api/chat`;
  const base64Data = dataUrl.split(',')[1];

  const body = {
    model: config.model,
    messages: [{
      role: 'user',
      content: SYSTEM_PROMPT,
      images: [base64Data]
    }],
    stream: false,
    options: {
      temperature: 0.1
    },
    format: 'json'
  };

  console.log('[MCQ AI] Sending request to Ollama. Model:', config.model);

  const res = await fetchViaBackground(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    console.error('[MCQ AI] Ollama error details:', res.body);
    const errMessage = res.body?.error || `Ollama API error (${res.status})`;
    throw new Error(errMessage);
  }

  const data = res.body;
  const text = data.message?.content;
  if (!text) throw new Error('Empty response from Ollama');

  return parseAIResponse(text);
}


// ═══════════════════════════════════════════════════════════════════════════
// Response Parser
// ═══════════════════════════════════════════════════════════════════════════

function parseAIResponse(text) {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  cleaned = cleaned.trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed.answer) {
      throw new Error('Response missing "answer" field');
    }
    return {
      answer: parsed.answer,
      explanation: parsed.explanation || 'No explanation provided.'
    };
  } catch (e) {
    // Fallback: try to extract JSON from the response
    const jsonMatch = cleaned.match(/\{[\s\S]*"answer"\s*:\s*"[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          answer: parsed.answer,
          explanation: parsed.explanation || 'No explanation provided.'
        };
      } catch {
        // Fall through
      }
    }
    
    // Last resort: treat entire response as the answer
    return {
      answer: cleaned,
      explanation: 'Could not parse structured response from AI.'
    };
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// Event Listeners
// ═══════════════════════════════════════════════════════════════════════════

function init() {
  // Capture button
  dom.btnCapture.addEventListener('click', captureAndSolve);

  // Retry button
  dom.btnRetry.addEventListener('click', captureAndSolve);

  // Settings
  dom.btnSettings.addEventListener('click', openSettings);
  dom.btnCloseSettings.addEventListener('click', closeSettings);
  dom.settingsOverlay.addEventListener('click', closeSettings);
  dom.btnSave.addEventListener('click', saveSettings);

  // Provider selector
  dom.providerBtns.forEach(btn => {
    btn.addEventListener('click', () => selectProvider(btn.dataset.provider));
  });

  // Fetch Models
  dom.btnFetchGeminiModels.addEventListener('click', fetchGeminiModels);

  // Accordion
  dom.btnAccordion.addEventListener('click', () => {
    dom.accordion.classList.toggle('open');
  });

  // Keyboard: Escape closes settings
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.settingsOpen) {
      closeSettings();
    }
  });

  // Load saved settings, then render
  loadSettings().then(() => {
    render();
  });
}

// Boot
document.addEventListener('DOMContentLoaded', init);
