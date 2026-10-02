chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes("anichart.net")) {
    chrome.tabs.sendMessage(tab.id, { action: "toggle_watching" });
  }
});
