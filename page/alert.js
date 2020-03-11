(() => {
	var mask = document.querySelector('#maskCover');
	var box = document.querySelector('#alertFrame');

	mask.addEventListener('click', async () => {
		mask.classList.remove('show');
		box.style.opacity = '0';
		await wait(300);
		box.style.display = 'none';
	});

	window.Alert = {};
	window.Alert.show = async (msg, title='通知') => {
		mask.classList.add('show');

		box.querySelector('.title').innerHTML = title;
		box.querySelector('.content').innerHTML = msg;

		box.style.display = 'block';
		await wait(50);
		box.style.opacity = '1';
	};
}) ();