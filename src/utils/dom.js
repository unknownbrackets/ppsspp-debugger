function isSubsetBounds(bounds, parentBounds) {
	if (bounds.top < parentBounds.top || bounds.left < parentBounds.left) {
		return false;
	}
	if (bounds.bottom > parentBounds.bottom || bounds.right > parentBounds.right) {
		return false;
	}
	return true;
}

export function isInView(node) {
	const windowBounds = { top: 0, left: 0, bottom: window.innerHeight, right: window.innerWidth };
	const rect = node.getBoundingClientRect();
	if (!isSubsetBounds(rect, windowBounds)) {
		return false;
	}

	let parentNode = node;
	while ((parentNode = parentNode.parentNode) !== null) {
		if (parentNode instanceof HTMLElement) {
			const style = window.getComputedStyle(parentNode);
			const overflows = style.overflow + style.overflowX + style.overflowY;
			if (style.position === 'static' && overflows.indexOf('auto') === -1 && overflows.indexOf('scroll') === -1) {
				continue;
			}

			if (!isSubsetBounds(rect, parentNode.getBoundingClientRect())) {
				return false;
			}
		}
	}

	return true;
}

export function ensureInView(node, options) {
	if (!isInView(node)) {
		node.scrollIntoView(options);
		return true;
	}

	return false;
}

let contextMenuStatus = false;

window.addEventListener('REACT_CONTEXTMENU_SHOW', (ev) => {
	contextMenuStatus = true;
});
window.addEventListener('REACT_CONTEXTMENU_HIDE', (ev) => {
	contextMenuStatus = false;
});

export function hasContextMenu() {
	return contextMenuStatus;
}
