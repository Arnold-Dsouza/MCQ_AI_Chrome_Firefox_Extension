# MCQ AI

A lightweight browser extension that lets you capture multiple-choice questions on your screen and get the answer (along with an explanation) instantly using AI. 

I built this to be fast and simple. It lives right in your browser's sidebar, so it's always one click away when you're going through practice tests, quizzes, or assignments.

## Features
- **One-click capture**: Takes a screenshot of your active tab and sends it straight to the AI.
- **Bring your own key**: Supports Gemini (Google AI Studio), OpenRouter, or any custom OpenAI-compatible endpoint.
- **Local AI Support**: Hook it up to Ollama and run vision models (like `llama3.2-vision`) entirely locally and for free. 
- **Dynamic Model Fetching**: Automatically loads the latest Gemini models available to your specific API key.
- **Cross-browser**: Works out of the box in both Chrome and Firefox.

## Installation

### Chrome / Edge / Brave
1. Go to `chrome://extensions/` in your browser.
2. Turn on **Developer mode** (usually a toggle in the top right).
3. Click **Load unpacked** and select the folder containing this extension.
4. Pin the extension to your toolbar. Click the icon to open the sidebar.

### Firefox
1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on...**
3. Select the `manifest.json` file inside the extension folder.
4. Click the extension icon in your toolbar to open the sidebar.

## Setup & Usage
1. Open the MCQ AI sidebar.
2. Click the **Settings** gear icon in the top right.
3. Pick your preferred AI provider (Gemini, OpenRouter, Custom, or Ollama) and enter your API key. 
   - *Tip for Gemini: Click the little refresh button next to the model dropdown to automatically pull the list of models your key supports.*
   - *Tip for Ollama: Make sure you start your local server with `OLLAMA_ORIGINS="*"` so the extension is allowed to talk to it.*
4. Hit **Save Settings**.
5. Click **Capture & Solve**. The extension takes a screenshot of your active tab, figures out the question, and gives you the answer + a step-by-step explanation.

## Privacy
This extension doesn't track you or collect telemetry. Screenshots are only taken when you explicitly click the capture button, and they are sent directly to the AI provider you configure. If you use Ollama, your screenshots and data stay 100% on your local machine.
