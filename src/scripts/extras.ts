// Extra UI and decoration: palette switcher, back-to-top button, reading progress,
// and the behaviour of the "Skip to..." menu.
//
// The site changes pages without reloading, so this file runs once. Things that live
// in <body> or depend on the current page are set up again on each page change.

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// ---------- Palette switcher (temporary) ----------
// To remove it later, delete this whole section and the .palette-btn rules in extras.css.
const PALETTES = [
	{ id: 'sakura-peach', name: 'Sakura Peach' },
	{ id: 'butter-pink', name: 'Butter Pink' },
	{ id: 'lilac-mint', name: 'Lilac Mint' },
	{ id: 'sky-pink', name: 'Sky Pink' },
	{ id: 'mint-butter', name: 'Mint Butter' },
	{ id: 'aqua-coral', name: 'Aqua Coral' },
];

const paletteBtn = document.createElement('button');
paletteBtn.type = 'button';
paletteBtn.className = 'palette-btn';

// Start from whichever palette the page already has (the head script restores it)
let paletteIndex = Math.max(
	0,
	PALETTES.findIndex((p) => p.id === root.dataset.theme),
);

function showPalette() {
	const palette = PALETTES[paletteIndex];
	root.dataset.theme = palette.id;
	paletteBtn.textContent = `Palette: ${palette.name}`;
	paletteBtn.setAttribute('aria-label', `Colour palette: ${palette.name}. Click for the next one.`);
	try {
		localStorage.setItem('palette', palette.id);
	} catch {
		// Storage can be blocked, in which case the palette just won't be remembered
	}
}

paletteBtn.addEventListener('click', () => {
	paletteIndex = (paletteIndex + 1) % PALETTES.length;
	showPalette();
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

// Both buttons live in <body>, which is replaced on every page change, so we put
// the same two buttons back each time.
function attachFloatingButtons() {
	document.body.append(paletteBtn, toTop);
}

attachFloatingButtons();
document.addEventListener('astro:after-swap', attachFloatingButtons);

// ---------- Keep the <html> settings across page changes ----------
// A page change copies the new page's <html> attributes over the old ones, which would
// wipe our palette and the "js" marker. So we set them on the new page before it swaps in.
document.addEventListener('astro:before-swap', (event: Event) => {
	const { newDocument } = event as Event & { newDocument: Document };
	const nextRoot = newDocument.documentElement;
	nextRoot.classList.add('js');
	nextRoot.dataset.theme = PALETTES[paletteIndex].id;
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
