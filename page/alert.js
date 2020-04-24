(() => {
	var mask = document.querySelector('#maskCover');
	var box = document.querySelector('#alertFrame');
	var notify = document.querySelector('#notifyFrame');
	var currCB = null;

	window.Alert = {};
	window.Alert.show = async (msg, title='通知', cb) => {
		box.querySelector('.title').innerHTML = title;
		box.querySelector('.content').innerHTML = msg;

		mask.classList.add('show');
		box.style.display = 'block';

		if (!!currCB) {
			try {
				currCB();
			} catch {}
			currCB = null;
		}
		if (!!cb) currCB = cb;
		await wait(50);

		box.style.opacity = '1';
	};
	window.Alert.close = async () => {
		mask.classList.remove('show');
		box.style.opacity = '0';

		if (!!currCB) {
			try {
				currCB();
			} catch {}
			currCB = null;
		}
		await wait(300);

		box.style.display = 'none';
	};
	window.Alert.notify = async msg => {
		if (!!notify.closer) {
			clearTimeout(notify.closer);
			notify.closer = null;
		}
		notify.innerText = msg;
		notify.classList.add('show');
		notify.closer = setTimeout(() => {
			notify.classList.remove('show');
			notify.className = '';
		}, 3000);
	};

	mask.addEventListener('click', window.Alert.close);
}) ();