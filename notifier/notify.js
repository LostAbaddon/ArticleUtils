class Message {
	ele;
	message;
	#content;
	#isTop = false;
	#isLeft = true;
	#duration = 0;
	#alive = true;
	#callback;
	#closer;

	constructor (message, duration, isLeft, isTop) {
		this.#isTop = isTop;
		this.#isLeft = isLeft;
		this.#duration = duration;
		this.message = message;

		this.ele = newEle('div', 'notify_frame');
		if (isLeft) this.ele.classList.add('notify_left')
		else this.ele.classList.add('notify_right')
		this.ele.addEventListener('click', () => {
			this.hide();
		});

		this.#content = newEle('div', 'notify_content');
		this.#content.innerHTML = message;
		this.ele.appendChild(this.#content);

		if (this.#isLeft) this.ele.style.left = '-105%';
		else this.ele.style.right = '-105%';
		document.body.appendChild(this.ele);

		this.#closer = setTimeout(() => {
			this.hide();
		}, duration);
	}
	continue () {
		if (!this.#alive) return;
		if (!!this.#closer) clearTimeout(this.#closer);
		this.#closer = setTimeout(() => {
			this.hide();
		}, this.#duration);
	}
	onFade (cb) {
		this.#callback = cb;
	}
	updateOffset (offset) {
		if (this.#isTop) this.ele.style.top = offset + 'px';
		else this.ele.style.bottom = offset + 'px';
	}
	async show (offset) {
		await wait(100);
		if (this.#isLeft) this.ele.style.left = '-0.1%';
		else this.ele.style.right = '-0.1%';
		if (this.#isTop) this.ele.style.top = offset + 'px';
		else this.ele.style.bottom = offset + 'px';
	}
	async hide () {
		if (!this.#alive) return;
		this.#alive = false;

		await wait();

		if (this.#isLeft) this.ele.style.left = '-105%';
		else this.ele.style.right = '-105%';

		await wait(1000);
		if (!!this.#callback) this.#callback();

		this.ele.removeEventListener('click', this.hide);
		document.body.removeChild(this.ele);
		this.ele.removeChild(this.#content);

		this.#content = null;
		this.ele = null;
		this.#closer = null;
		this.message = null;
	}
	get height () {
		var rect = this.ele.getBoundingClientRect();
		return rect.height;
	}
}

window.TextNotifier = {
	_initialed: false,
	_duration: 3000,
	_isTop: false,
	_isLeft: true,
	_MessageList: []
};
window.TextNotifier.init = (top=TextNotifier._isTop, left=TextNotifier._isLeft, duration=TextNotifier._duration) => {
	if (TextNotifier._initialed) return;
	TextNotifier._initialed = true;

	TextNotifier._duration = duration;
	TextNotifier._isTop = top;
	TextNotifier._isLeft = left;

	var style = newEle('link');
	style.rel = 'stylesheet';
	style.href = chrome.extension.getURL('/notifier/notify.css');
	document.body.appendChild(style);
};
window.TextNotifier.notify = message => {
	var msg;
	TextNotifier._MessageList.some(m => {
		if (m.message === message) {
			msg = m;
			return true;
		}
	});

	if (!msg) {
		let offset = 20;
		TextNotifier._MessageList.forEach(msg => {
			var rect = msg.ele.getBoundingClientRect();
			offset += rect.height + 5;
		});

		msg = new Message(message, TextNotifier._duration, TextNotifier._isLeft, TextNotifier._isTop);
		TextNotifier._MessageList.push(msg);

		msg.onFade(() => {
			var index = TextNotifier._MessageList.indexOf(msg);
			if (index >= 0) TextNotifier._MessageList.splice(index, 1);
			TextNotifier._onMessageFade();
		}); 
		msg.show(offset);
	} else {
		msg.continue();
	}

};
window.TextNotifier._onMessageFade = () => {
	var offset = 20;
	TextNotifier._MessageList.forEach(msg => {
		var rect = msg.ele.getBoundingClientRect();
		msg.updateOffset(offset);
		offset += rect.height + 5;
	});
};