var urlStarPort = '/library/index.html';

window.PageActions = window.PageActions || {};

window.PageActions.onLoad = config => {
	const cancelRuleArea = () => {
		document.querySelector('div#RuleArea').style.display = 'none';
	};

	chrome.tabs.getSelected(tab => {
		var url = tab.url.split('?')[0];
		var protocol = url.split('://')[0];
		if (!protocol) return cancelRuleArea();
		var low = protocol.toLowerCase();
		if (low.indexOf('chrome') >= 0 || low.indexOf('devtool') >= 0) return cancelRuleArea();
		url = url.replace(protocol + '://', '');
		url = url.split('/');
		if (url.length > 2) url.splice(2, url.length - 2);
		url = url.join('/');

		document.querySelector('span#DomainName').innerText = url;

		var cfg = config.SilenceRules;
		var rules = cfg[url];
		if (!rules) {
			rules = {};
			Object.keys(config.DefaultSearchEngine).forEach(key => rules[key] = config.DefaultSearchEngine[key]);
		} else {
			Object.keys(config.DefaultSearchEngine).forEach(key => {
				if (rules[key] === undefined) rules[key] = config.DefaultSearchEngine[key]
			});
		}

		Object.keys(rules).forEach(name => {
			document.querySelector('div#RuleArea input[type=checkbox][name="search:' + name + '"]').checked = rules[name];
		});

		window.PageActions.ChangeSearchRule = (key, value) => {
			key = key.replace('search:', '');
			rules[key] = value;
			cfg[url] = rules;
			ExtConfigManager.set('SilenceRules', cfg);
		};
	});

	var config = ExtConfigManager.get('BackendServer');
	var url = 'http://' + config.host + ':' + config.port + '/api/shakehand.js';
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.onreadystatechange = () => {
		if (xhr.readyState == 4) {
			let json;
			if (xhr.status === 0 || xhr.response === '') {
				json.ok = false;
			}
			else {
				try {
					json = JSON.parse(xhr.responseText);
				}
				catch {
					json.ok = false;
				}
			}
			if (!json.ok) StarPort.style.display = 'none';
			else urlStarPort = 'http://' + config.host + ':' + json.data.port;
		}
	};
	xhr.send();
};
window.PageActions.ToggleArchieve = () => {
	chrome.tabs.getSelected(tab => {
		chrome.tabs.sendMessage(tab.id, {
			event: 'ToggleArchieve'
		});
	});
};
window.PageActions.ViewArchieve = () => {
	chrome.tabs.create({ url: chrome.runtime.getURL('/page/archieve.html'), active: true });
};
window.PageActions.EnterEditor = () => {
	chrome.tabs.create({ url: chrome.runtime.getURL('/library/index.html'), active: true });
};
window.PageActions.EnterStarPort = () => {
	chrome.tabs.create({ url: urlStarPort, active: true });
};