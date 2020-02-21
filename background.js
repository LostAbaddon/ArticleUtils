chrome.webRequest.onBeforeRequest.addListener(req => {
	var url = req.url;
	if (url.indexOf('chrome-extension:') < 0) return;
	console.log('On Web Request:', url);
}, {urls: ["<all_urls>"]});