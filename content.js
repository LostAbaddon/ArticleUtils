(root => {
	if (!!root.MathJax) return;

	var config = newEle('script');
	config.type = 'text/x-mathjax-config';
	config.innerHTML = 'MathJax.Hub.Config({ extensions: ["tex2jax.js"], jax: ["input/TeX","output/HTML-CSS"], tex2jax: {inlineMath: [["$","$"],["\\\\(","\\\\)"]]} });';
	document.body.appendChild(config);

	var mathjax = newEle('script');
	mathjax.type = 'text/javascript';
	mathjax.src = chrome.extension.getURL('MathJax2.5/MathJax.js');
	document.body.appendChild(mathjax);
}) (window);