function createScratchpad() {
	const div = document.createElement('div');
	div.id = 'clipboard-scratchpad';
	div.style.width = 1;
	div.style.height = 1;
	div.style.opacity = 0;
	div.style.position = 'absolute';
	div.style.top = 0;
	div.style.left = 0;
	div.style.pointerEvents = 'none';
	div.style.whiteSpace = 'pre';
	document.body.appendChild(div);

	return div;
}

function getScratchpad() {
	const div = document.getElementById('clipboard-scratchpad');
	if (!div) {
		return createScratchpad();
	}
	return div;
}

export function copyText(text) {
	const scratchpad = getScratchpad();
	scratchpad.textContent = text;

	const textNode = scratchpad.firstChild;
	const range = document.createRange();
	range.setStart(textNode, 0);
	range.setEnd(textNode, text.length);

	const selection = window.getSelection();
	const oldRange = selection.getRangeAt(0);

	selection.removeAllRanges();
	selection.addRange(range);

	try {
		document.execCommand('copy');
	} catch (e) {
		window.prompt('Use Ctrl-C or Command-C to copy', text);
	}

	selection.removeAllRanges();
	selection.addRange(oldRange);
}
