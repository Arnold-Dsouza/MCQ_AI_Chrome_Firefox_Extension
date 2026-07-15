/**
 * MCQ AI — Background Service Worker
 * Handles screen capture and message routing between sidebar and active tab.
 */

const api = typeof browser !== 'undefined' ? browser : chrome;

// ─── Side Panel Registration ────────────────────────────────────────────────
api.runtime.onInstalled.addListener(() => {
  if (api.sidePanel && api.sidePanel.setPanelBehavior) {
    api.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});

// Open side panel on action click (Chrome)
api.action.onClicked.addListener(async (tab) => {
  if (api.sidePanel && api.sidePanel.open) {
    await api.sidePanel.open({ tabId: tab.id });
  }
});

// ─── Message Handler ────────────────────────────────────────────────────────
api.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureScreen') {
    handleCapture(sendResponse);
    return true; // Keep message channel open for async response
  }
  if (message.action === 'apiFetch') {
    handleApiFetch(message.requestData, sendResponse);
    return true; // Keep message channel open for async response
  }
});

/**
 * Captures the visible area of the currently active tab.
 * Returns a base64-encoded PNG data URL.
 */
async function handleCapture(sendResponse) {
  try {
    const [tab] = await api.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      sendResponse({ error: 'No active tab found.' });
      return;
    }

    // chrome.tabs.captureVisibleTab returns a data URL
    const dataUrl = await api.tabs.captureVisibleTab(tab.windowId, {
      format: 'png',
      quality: 92
    });

    sendResponse({ dataUrl });
  } catch (err) {
    console.error('[MCQ AI] Capture failed:', err);
    sendResponse({ error: err.message || 'Screen capture failed.' });
  }
}

/**
 * Executes a network fetch request from the background service worker context.
 * Bypasses page-level CORS and header limitations.
 */
async function handleApiFetch(requestData, sendResponse) {
  try {
    const { url, options } = requestData;
    
    console.log(`[MCQ AI] Background fetching URL: ${url}`);
    
    // Diagnostic logging
    if (options && options.headers) {
      console.log('[MCQ AI] Request header keys:', Object.keys(options.headers));
      if (options.headers.Authorization) {
        const masked = options.headers.Authorization.length > 20
          ? options.headers.Authorization.substring(0, 15) + '...'
          : '[Short key]';
        console.log('[MCQ AI] Authorization header:', masked);
      } else {
        console.log('[MCQ AI] Authorization header is missing in request options headers.');
      }
    } else {
      console.log('[MCQ AI] No headers provided in request options.');
    }

    const res = await fetch(url, options);
    
    const status = res.status;
    const ok = res.ok;
    
    let body;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await res.json();
    } else {
      body = await res.text();
    }
    
    sendResponse({ ok, status, body });
  } catch (err) {
    console.error('[MCQ AI] Background fetch failed:', err);
    sendResponse({ error: err.message || 'Network request failed in background worker.' });
  }
}
