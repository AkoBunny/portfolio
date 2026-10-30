// Extra UI and decoration: palette switcher, back-to-top button, reading progress,
// and the behaviour of the "Skip to..." menu.
//
// The site changes pages without reloading, so this file runs once. Things that live
// in <body> or depend on the current page are set up again on each page change.

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// ---------- Palette switcher (temporary) ----------
// To remove it later, delete this whole section and the .palette-* rules in extras.css.
const PALETTES = [
	{ id: 'sakura-peach', name: 'Sakura Peach' },
	{ id: 'butter-pink', name: 'Butter Pink' },
	{ id: 'lilac-mint', name: 'Lilac Mint' },
	{ id: 'sky-pink', name: 'Sky Pink' },
	{ id: 'mint-butter', name: 'Mint Butter' },
	{ id: 'aqua-coral', name: 'Aqua Coral' },
];

// Custom colours: two hex codes typed in by hand. When customMode is on they win over
// the presets. The two keys match the two palette variables: --accent and --accent-2.
type ColourKey = 'accent' | 'accent2';
type Colours = Record<ColourKey, string>;

const CARD_BG = '#1e2127'; // text colours are checked for contrast against the card colour

let customMode = false;
let custom: Colours = { accent: '#ffa987', accent2: '#ffb7c5' };

// "ffa987", "#FFA987" and " #ffa987 " all become "#ffa987". Anything else gives null.
function parseHex(text: string): string | null {
	const h = text.trim().replace(/^#/, '').toLowerCase();
	return /^[0-9a-f]{6}$/.test(h) ? `#${h}` : null;
}

// "#ffa987" -> "rgba(255, 169, 135, 0.12)" (used for the faint glow behind the page)
function hexToRgba(hex: string, alpha: number): string {
	const n = parseInt(hex.slice(1), 16);
	return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

// Contrast ratio, the same maths WCAG (the accessibility guidelines) uses.
// A colour's channels (0-255) are not linear: 128 is not "half as bright" as 255 to the
// eye or to a renderer. So we first convert each channel to linear light, then weight
// them by how bright each one looks to us (green most, blue least).
function luminance(hex: string): number {
	const [r, g, b] = [1, 3, 5].map((i) => {
		const c = parseInt(hex.slice(i, i + 2), 16) / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
	const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (light + 0.05) / (dark + 0.05);
}

const paletteBox = document.createElement('div');
paletteBox.className = 'palette-box';

function colourRow(key: ColourKey, label: string, hint: string) {
	return `
		<div class="palette-row" data-colour="${key}">
			<div class="palette-label">${label} <span>${hint}</span></div>
			<div class="palette-fields">
				<input type="color" class="palette-picker" aria-label="${label} colour picker">
				<input type="text" class="palette-hex" maxlength="7" spellcheck="false" autocomplete="off" aria-label="${label} hex code">
				<span class="palette-ratio"></span>
			</div>
		</div>`;
}

paletteBox.innerHTML = `
	<div class="palette-panel" hidden>
		${colourRow('accent', 'Accent', 'labels, links, small text')}
		${colourRow('accent2', 'Headings', 'section titles, hovers')}
		<p class="palette-note">Type six hex digits (like #ffa987) or use the swatch. The ratio is contrast against the card colour; 4.5 or more is good for text.</p>
	</div>
	<div class="palette-bar">
		<button type="button" class="palette-btn" data-act="cycle"></button>
		<button type="button" class="palette-btn" data-act="toggle" aria-expanded="false">Custom</button>
	</div>
`;

const panel = paletteBox.querySelector<HTMLElement>('.palette-panel')!;
const cycleBtn = paletteBox.querySelector<HTMLButtonElement>('[data-act="cycle"]')!;
const toggleBtn = paletteBox.querySelector<HTMLButtonElement>('[data-act="toggle"]')!;

const fields = {} as Record<ColourKey, { picker: HTMLInputElement; text: HTMLInputElement; ratio: HTMLElement }>;
(['accent', 'accent2'] as ColourKey[]).forEach((key) => {
	const row = paletteBox.querySelector<HTMLElement>(`[data-colour="${key}"]`)!;
	fields[key] = {
		picker: row.querySelector<HTMLInputElement>('.palette-picker')!,
		text: row.querySelector<HTMLInputElement>('.palette-hex')!,
		ratio: row.querySelector<HTMLElement>('.palette-ratio')!,
	};
});

// Start from whichever palette the page already has (the head script restores it)
let paletteIndex = Math.max(
	0,
	PALETTES.findIndex((p) => p.id === root.dataset.theme),
);

if (root.dataset.theme === 'custom') {
	customMode = true;
	try {
		const saved = JSON.parse(localStorage.getItem('custom-palette') ?? 'null');
		const a = parseHex(saved?.accent ?? '');
		const b = parseHex(saved?.accent2 ?? '');
		if (a && b) custom = { accent: a, accent2: b };
	} catch {
		// Unreadable saved colours: just keep the defaults above
	}
}

// The colours on screen right now. For a preset we ask the browser what the CSS says.
function currentColours(): Colours {
	if (customMode) return custom;
	const style = getComputedStyle(root);
	return {
		accent: parseHex(style.getPropertyValue('--accent')) ?? '#ffffff',
		accent2: parseHex(style.getPropertyValue('--accent-2')) ?? '#ffffff',
	};
}

// Put the current palette onto an <html> element. Used for the live page and, during a
// page change, for the incoming page (see astro:before-swap below).
function paintRoot(el: HTMLElement) {
	if (customMode) {
		el.dataset.theme = 'custom';
		el.style.setProperty('--accent', custom.accent);
		el.style.setProperty('--accent-2', custom.accent2);
		el.style.setProperty('--glow', hexToRgba(custom.accent2, 0.12));
	} else {
		el.dataset.theme = PALETTES[paletteIndex].id;
		['--accent', '--accent-2', '--glow'].forEach((name) => el.style.removeProperty(name));
	}
}

// Make the swatches, hex boxes and contrast numbers match what is on screen
function syncFields() {
	const now = currentColours();
	(['accent', 'accent2'] as ColourKey[]).forEach((key) => {
		const { picker, text, ratio } = fields[key];
		picker.value = now[key];
		// Don't rewrite the box while she is typing in it
		if (document.activeElement !== text) {
			text.value = now[key];
			text.classList.remove('invalid');
		}
		const r = contrast(now[key], CARD_BG);
		ratio.textContent = `${r.toFixed(1)}:1 ${r >= 4.5 ? 'OK' : 'low'}`;
		ratio.classList.toggle('low', r < 4.5);
	});
}

function showPalette() {
	paintRoot(root);
	const name = customMode ? 'Custom' : PALETTES[paletteIndex].name;
	cycleBtn.textContent = `Palette: ${name}`;
	cycleBtn.setAttribute('aria-label', `Colour palette: ${name}. Click for the next preset.`);
	syncFields();
	try {
		localStorage.setItem('palette', customMode ? 'custom' : PALETTES[paletteIndex].id);
		if (customMode) {
			localStorage.setItem(
				'custom-palette',
				JSON.stringify({ ...custom, glow: hexToRgba(custom.accent2, 0.12) }),
			);
		}
	} catch {
		// Storage can be blocked, in which case the palette just won't be remembered
	}
}

// Change one custom colour. The first edit starts from the preset currently showing.
function setCustom(key: ColourKey, hex: string) {
	if (!customMode) {
		custom = { ...currentColours() };
		customMode = true;
	}
	custom[key] = hex;
	showPalette();
}

cycleBtn.addEventListener('click', () => {
	// From custom, go back to the presets; otherwise move to the next one
	if (customMode) customMode = false;
	else paletteIndex = (paletteIndex + 1) % PALETTES.length;
	showPalette();
});

toggleBtn.addEventListener('click', () => {
	panel.hidden = !panel.hidden;
	toggleBtn.setAttribute('aria-expanded', String(!panel.hidden));
});

(['accent', 'accent2'] as ColourKey[]).forEach((key) => {
	const { picker, text } = fields[key];

	picker.addEventListener('input', () => setCustom(key, picker.value));

	text.addEventListener('input', () => {
		const hex = parseHex(text.value);
		text.classList.toggle('invalid', !hex && text.value.trim() !== '');
		if (hex) setCustom(key, hex);
	});

	// Leaving the box tidies it: a half-typed code snaps back to the colour actually in use
	text.addEventListener('blur', syncFields);
});

showPalette();

// ---------- Back to top ----------
// The data-petals attribute makes the petal burst in decor.ts fire when it is clicked
const toTop = document.createElement('button');
toTop.type = 'button';
toTop.className = 'to-top';
toTop.setAttribute('aria-label', 'Back to top');
toTop.setAttribute('data-petals', '');
toTop.addEventListener('click', () => {
	window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
});

// Both live in <body>, which is replaced on every page change, so we put the same
// two elements back each time. (The palette box keeps its open/closed state because
// it is the same element, just re-attached.)
function attachFloatingButtons() {
	document.body.append(paletteBox, toTop);
}

attachFloatingButtons();
document.addEventListener('astro:after-swap', () => {
	attachFloatingButtons();
	syncFields();
});

// ---------- Keep the <html> settings across page changes ----------
// A page change copies the new page's <html> attributes over the old ones, which would
// wipe our palette (including custom colours, which are inline styles) and the "js"
// marker. So we set them on the new page before it swaps in.
document.addEventListener('astro:before-swap', (event: Event) => {
	const { newDocument } = event as Event & { newDocument: Document };
	const nextRoot = newDocument.documentElement;
	nextRoot.classList.add('js');
	paintRoot(nextRoot);
	if (newDocument.querySelector('.case-study')) nextRoot.classList.add('has-progress');
});

// ---------- Things that belong to the current page ----------
let isCaseStudy = false;
let tocLinks: HTMLAnchorElement[] = [];
let tocHeadings: (HTMLElement | null)[] = [];

// The current section is the last heading that has scrolled above 35% of the screen
function updateActive() {
	if (tocLinks.length === 0) return;
	let current = -1;
	tocHeadings.forEach((heading, i) => {
		if (heading && heading.getBoundingClientRect().top < window.innerHeight * 0.35) current = i;
	});
	tocLinks.forEach((link, i) => link.classList.toggle('active', i === current));
}

// One scroll handler for everything that reacts to scrolling
function onScroll() {
	const y = window.scrollY;
	toTop.classList.toggle('show', y > 600);

	if (isCaseStudy) {
		const max = root.scrollHeight - window.innerHeight;
		root.style.setProperty('--progress', String(max > 0 ? Math.min(1, y / max) : 0));
	}

	updateActive();
}

function initPage() {
	// Reading progress line (case-study pages only)
	isCaseStudy = document.querySelector('.case-study') !== null;
	root.classList.toggle('has-progress', isCaseStudy);
	document.querySelectorAll('.read-progress').forEach((bar) => bar.remove());

	const header = document.querySelector<HTMLElement>('.site-header');
	if (isCaseStudy && header) {
		const bar = document.createElement('div');
		bar.className = 'read-progress';
		header.appendChild(bar);
	}

	// "Skip to..." menu: close it after picking a section so it doesn't cover the content
	const toc = document.querySelector<HTMLDetailsElement>('.toc-float');
	tocLinks = toc ? Array.from(toc.querySelectorAll<HTMLAnchorElement>('a')) : [];
	tocHeadings = tocLinks.map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1))));
	tocLinks.forEach((link) => link.addEventListener('click', () => toc?.removeAttribute('open')));

	onScroll();
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
document.addEventListener('astro:page-load', initPage);

// ---------- Safety net for page changes ----------
// If a page change hasn't finished 5 seconds after the click, give up on the in-place
// swap and load the page the normal way, so you never get stuck.
let navTimer: number | undefined;

document.addEventListener('astro:before-preparation', (event: Event) => {
	const { to } = event as Event & { to: URL };
	window.clearTimeout(navTimer);
	navTimer = window.setTimeout(() => {
		window.location.href = to.href;
	}, 5000);
});

document.addEventListener('astro:page-load', () => window.clearTimeout(navTimer));

// Marks this file as a module, so its names don't clash with other scripts in the editor
export {};
