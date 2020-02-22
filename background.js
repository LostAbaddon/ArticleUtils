var rootPath = chrome.extension.getURL('MathJax2.5');
var urls = [];
var timer = null;
var callback = () => {
	console.log('Web Requests for MathJax:');
	urls.sort((a, b) => a > b ? 1 : -1);
	console.log(urls.join('\n'));
	urls.splice(0, urls.length);
	timer = null;
};

chrome.webRequest.onBeforeRequest.addListener(req => {
	var url = req.url;
	if (url.indexOf('chrome-extension:') < 0) return;
	if (url.indexOf('_generated_background_page.html') >= 0) return;

	url = url.replace(rootPath, '').split('?')[0];
	if (!urls.includes(url)) urls.push(url);
	if (!!timer) clearTimeout(timer);
	timer = setTimeout(callback, 1000);
}, {urls: ["<all_urls>"]});