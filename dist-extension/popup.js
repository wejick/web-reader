document.getElementById('btn-read').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.url || /^(chrome|about|edge|moz-extension|chrome-extension):/.test(tab.url)) {
    showStatus('Cannot read browser internal pages.', 'error');
    return;
  }

  try {
    await sendMessage(tab.id, { action: 'read' });
    window.close();
  } catch (e) {
    showStatus(e.message || 'Could not inject on this page.', 'error');
  }
});

async function sendMessage(tabId, msg) {
  try {
    return await chrome.tabs.sendMessage(tabId, msg);
  } catch {
    // Content script not yet injected (e.g. extension just installed, page
    // was open before the extension). Inject it programmatically and retry.
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
    return await chrome.tabs.sendMessage(tabId, msg);
  }
}

function showStatus(msg, type = 'info') {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = `status ${type}`;
}
