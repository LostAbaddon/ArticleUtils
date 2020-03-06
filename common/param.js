const ExtConfig = {};

window.ExtConfigManager = (config, callback) => new Promise(res => {
	Object.keys(config).forEach(key => ExtConfig[key] = config[key]);

	var available = false;
	try {
		if (!!chrome && !!chrome.storage) {
			available = true;
		} else {
			available = false;
		}
	} catch {
		available = false;
	}

	if (!available) {
		if (!!callback) callback('init', config);
		return res(config);
	}

	chrome.storage.sync.get(Object.keys(config), params => {
		if (!params) params = {};
		var notYet = {};
		Object.keys(config).forEach(key => notYet[key] = config[key]);
		Object.keys(params).forEach(key => {
			ExtConfig[key] = params[key];
			delete notYet[key];
		});
		if (Object.keys(notYet).length > 0) chrome.storage.sync.set(notYet);

		if (!!callback) callback('init', ExtConfig);
		res(ExtConfig);
	});

	chrome.storage.sync.onChanged.addListener(params => {
		var items = [];
		Object.keys(params).forEach(key => {
			if (ExtConfig[key] === undefined) return;
			var value = params[key].newValue;
			if (ExtConfig[key] !== value) {
				ExtConfig[key] = value;
				items.push(key);
			}
		});
		if (!callback) return;
		items.forEach(key => {
			callback('update', key, ExtConfig[key]);
		});
	});
});
ExtConfigManager.all = () => ExtConfig;
ExtConfigManager.get = key => ExtConfig[key];
ExtConfigManager.set = (key, value, cb) => new Promise(res => {
	if (ExtConfig[key] === undefined) return;
	ExtConfig[key] = value;
	var item = {};
	item[key] = value;
	chrome.storage.sync.set(item, () => {
		if (!!cb) cb();
		res();
	});
});
ExtConfigManager.update = cb => new Promise(res => {
	chrome.storage.sync.set(ExtConfig, () => {
		if (!!cb) cb();
		res();
	});
});