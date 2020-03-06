ExtConfigManager(DefaultExtConfig, (event, ...args) => {
	if (event === 'init') {
		let config = args[0];
		Object.keys(config).forEach(key => {
			if (!!ExtInitActions[key]) ExtInitActions[key](config[key]);
		});

		if (!!window.PageActions && !!window.PageActions.onLoad) window.PageActions.onLoad(config);
	}
});