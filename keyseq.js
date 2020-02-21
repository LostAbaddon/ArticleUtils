(() => {
	if (!!window.RegiestKeySeq) return;

	const ShortcutDelay = 250;
	const ShortcutMin = 2;
	const ShortcutMax = 10;

	const ShortcutManager = {};
	const KeyChain = [];

	var lastKeyTime = 0;
	var lastAction = null;
	var shouldStop = false;
	const dblmin = ShortcutMin * 2;
	const dblmax = ShortcutMax * 2;

	const offtimer = () => {
		if (!lastAction) return;
		clearTimeout(lastAction);
		lastAction = null;
	};
	const ontimer = action => {
		offtimer();
		lastAction = setTimeout(action, ShortcutDelay);
	};

	document.body.addEventListener("keydown", evt => {
		var stamp = now();
		if (stamp - lastKeyTime > ShortcutDelay) KeyChain.splice(0, KeyChain.length);
		lastKeyTime = stamp;

		var key = evt.key.toLowerCase();
		if (key === 'control') key = 'ctrl';
		KeyChain.push(key + '(');
		shouldStop = false;
	});
	document.body.addEventListener("keyup", evt => {
		if (!shouldStop) {
			KeyChain.push(')');
		} else {
			shouldStop = false;
			return;
		}

		ontimer(() => {
			var max = KeyChain.length;
			if (max < dblmin) return;
			if (max > dblmax) max = dblmax;

			var keys = KeyChain[max - 1];
			for (let i = 2; i < dblmin; i ++) {
				keys = KeyChain[max - i] + '+' + keys;
			}
			var targetAction = null;
			for (let i = dblmin; i <= max; i ++) {
				keys = KeyChain[max - i] + '+' + keys;
				if (keys.substr(0, 1) === ")") continue;

				var seq = keys.replace(/\(\+/gi, "(").replace(/\+\)/gi, ")").replace(/\(\)/gi, "");
				let action = ShortcutManager[seq];
				if (!!action) {
					targetAction = action;
				}
			}
			if (!!targetAction) {
				shouldStop = true;
				KeyChain.splice(0, KeyChain.length);
				targetAction();
			}
		});
	});

	window.RegiestKeySeq = (event, callback) => ShortcutManager[event] = callback;
})();