(() => {
	var mask = document.querySelector('#maskCover');
	var box = document.querySelector('#alertFrame');
	var notify = document.querySelector('#notifyFrame');

	mask.addEventListener('click', async () => {
		mask.classList.remove('show');
		box.style.opacity = '0';
		await wait(300);
		box.style.display = 'none';
	});

	window.Alert = {};
	window.Alert.show = async (msg, title='通知') => {
		box.querySelector('.title').innerHTML = title;
		box.querySelector('.content').innerHTML = msg;

		mask.classList.add('show');
		box.style.display = 'block';
		await wait(50);
		box.style.opacity = '1';
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
			notify.classList = null;
		}, 3000);
	};
}) ();