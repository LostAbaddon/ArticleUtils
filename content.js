const autoMath = () => {
	if (!!window.MathJax) return;

	var config = newEle('script');
	config.type = 'text/x-mathjax-config';
	config.innerHTML = `MathJax.Hub.Config({
		extensions: ["tex2jax.js"],
		TeX: {
			extensions: ["AMSmath.js", "AMSsymbols.js"]
		},
		jax: ["input/TeX", "output/HTML-CSS"],
		tex2jax: {
			inlineMath: [["$","$"]]}
		});`;
	document.body.appendChild(config);

	loadJS(chrome.extension.getURL('MathJax2.5/MathJax.js?config=TeX-AMS_HTML'));
};

const onInit = config => {
	if (config.AutoMath) autoMath();
};

ExtConfigManager(DefaultExtConfig, (event, key, value) => {
	if (event === 'init') onInit(key);
});

(() => {
	RegiestKeySeq('ctrl+ctrl+m', 'test', async () => {
		var last = ExtConfigManager.get('AutoMath');
		await ExtConfigManager.set('AutoMath', !last);
		if (last) {
			window.location.reload();
		} else {
			autoMath();
		}
	});
}) ();