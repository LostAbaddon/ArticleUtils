const InitNotes = UI => {
	const NoteFrame = document.querySelector('#footnoteFrame');
	NoteFrame._status = 0;

	UI.addEventListener('transitionstart', async evt => {
		var ele = evt.target, cn = ele.className;
		if (cn === 'notemark' || cn ==='terminology') {
			var css = ele.computedStyleMap();
			css = css.get('text-decoration').toString();
			var enter = false;
			if (css.indexOf('underline') >= 0) enter = true;

			if (enter) {
				var name = ele.getAttribute('href');
				if (name.substr(0, 1) !== '#') return;
				name = name.substring(1, name.length);
				var info = UI.querySelector('a[name="' + name + '"]');
				if (!info) return;
				var content = info.parentElement.innerHTML.replace(info.outerHTML, '');
				var html = '';

				if (cn === 'terminology') {
					html = '<p class="note-title">' + ele.innerText + '</p>';
				}
				html += '<p class="note-content">' + content + '</p>';
				NoteFrame.innerHTML = html;
				NoteFrame._status = 1;

				var rect = ele.getBoundingClientRect();
				var isTop = true, isLeft = true;
				var left = rect.left - 10;
				var top = rect.top + rect.height + 10;
				if (left > window.innerWidth * 0.6) {
					isLeft = false;
					left = window.innerWidth - rect.right;
				}
				if (top > window.innerHeight * 0.7) {
					isTop = false;
					top = window.innerHeight - rect.top;
				}

				if (isLeft) {
					NoteFrame.style.left = left + 'px';
					NoteFrame.style.right = '';
				}
				else {
					NoteFrame.style.left = '';
					NoteFrame.style.right = left + 'px';
				}
				if (isTop) {
					NoteFrame.style.top = top + 'px';
					NoteFrame.style.bottom = '';
				}
				else {
					NoteFrame.style.top = '';
					NoteFrame.style.bottom = top + 'px';
				}
				NoteFrame.style.display = 'block';
				await wait(50);
				NoteFrame.style.opacity = '1';
				NoteFrame._status = 2;
			}
			else {
				NoteFrame.style.opacity = '0';
				await wait(200);
				if (NoteFrame._status === 2) {
					NoteFrame.style.display = 'none';
					NoteFrame._status = 0;
				}
			}
		}
	});
};