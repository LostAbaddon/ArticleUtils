(() => {
	var injected = [].some.call(document.querySelectorAll('script'), s => {
		return s.src.indexOf('/keyseq.js') >= 0;
	});

	var loaded = false;

	window.addEventListener('message', msg => {
		msg = msg.data;
		if (!msg) return;
		if (msg.event === 'KeySeqLoaded') {
			loaded = true;
			Prepares.forEach(item => {
				window.postMessage({ event: "RegisterKeySeq", keyseq: item[0], action: item[1] }, location.origin);
			});
			Prepares.splice(0, Prepares.length);
		} else if (msg.event === 'ToggleKeySeq') {
			ToggleAction(msg.action);
		}
	});

	const Actions = {};
	const Prepares = [];
	const ToggleAction = action => {
		var cbs = Actions[action];
		if (!cbs) return;
		cbs.forEach(cb => cb());
	};
	window.RegiestKeySeq = (keyseq, action, callback) => {
		var list = Actions[action];
		if (!list) {
			list = [];
			Actions[action] = list;
		}
		if (!!callback) list.push(callback);

		if (loaded) {
			window.postMessage({ event: "RegisterKeySeq", keyseq, action }, location.origin);
		} else {
			Prepares.push([keyseq, action]);
		}
	};

	if (!injected) loadJS(chrome.extension.getURL('keyseq.js'));
}) ();