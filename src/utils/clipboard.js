// We set this to false when we trigger one.
let userInitiated = true;

let listeners = [];

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
	userInitiated = false;

	try {
		const scratchpad = getScratchpad();
		scratchpad.textContent = text;

		const textNode = scratchpad.firstChild;
		const range = document.createRange();
		range.setStart(textNode, 0);
		range.setEnd(textNode, text.length);

		const selection = window.getSelection();
		const oldRange = selection.rangeCount !== 0 ? selection.getRangeAt(0) : null;

		selection.removeAllRanges();
		selection.addRange(range);

		try {
			document.execCommand('copy');
		} catch (e) {
			window.prompt('Use Ctrl-C or Command-C to copy', text);
		}

		selection.removeAllRanges();
		if (oldRange) {
			selection.addRange(oldRange);
		}
	} finally {
		userInitiated = true;
	}
}

export function listenCopy(selector, handler) {
	listeners.push({ selector, handler });
}

export function forgetCopy(selector, handler) {
	listeners = listeners.filter(l => l.selector !== selector && l.handler !== handler);
}

if (!Element.prototype.matches) {
	Element.prototype.matches = Element.prototype.msMatchesSelector;
}

function hasClosestMatch(node, selector) {
	while (node && node !== document) {
		if (node.matches(selector)) {
			return true;
		}
		node = node.parentNode;
	}

	return false;
}

document.addEventListener('copy', (ev) => {
	const range = document.getSelection().rangeCount !== 0 ? document.getSelection().getRangeAt(0) : null;
	if ((range && !range.collapsed) || !userInitiated) {
		// Skip if the user has anything actually selected, or if we triggered this 'copy' command.
		return;
	}

	for (let listener of listeners) {
		if (!hasClosestMatch(document.activeElement, listener.selector)) {
			continue;
		}

		const result = listener.handler(ev);
		if (result) {
			// Unfortunate, but newline conversion isn't automatic...
			if (/win/i.test(window.navigator.platform)) {
				ev.clipboardData.setData('text/plain', result.replace(/\n/g, '\r\n'));
			} else {
				ev.clipboardData.setData('text/plain', result);
			}
			ev.preventDefault();
		}
	}
});
