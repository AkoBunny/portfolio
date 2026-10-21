// Extra UI and decoration: palette switcher, back-to-top button, reading progress,
// and the behaviour of the "Skip to..." menu.

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
document.body.appendChild(paletteBtn);

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
document.body.appendChild(toTop);

// ---------- Reading progress (case-study pages only) ----------
const isCaseStudy = document.querySelector('.case-study') !== null;
const header = document.querySelector<HTMLElement>('.site-header');

if (isCaseStudy && header) {
	root.classList.add('has-progress');
	const bar = document.createElement('div');
	bar.className = 'read-progress';
	header.appendChild(bar);
}

// ---------- "Skip to..." menu ----------
const toc = document.querySelector<HTMLDetailsElement>('.toc-float');
const tocLinks = toc ? Array.from(toc.querySelectorAll<HTMLAnchorElement>('a')) : [];
const tocHeadings = tocLinks.map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1))));

// The current section is the last heading that has scrolled above 35% of the screen
function updateActive() {
	if (tocLinks.length === 0) return;
	let current = -1;
	tocHeadings.forEach((heading, i) => {
		if (heading && heading.getBoundingClientRect().top < window.innerHeight * 0.35) current = i;
	});
	tocLinks.forEach((link, i) => link.classList.toggle('active', i === current));
}

// Close the menu after picking a section so it doesn't cover the content
tocLinks.forEach((link) => link.addEventListener('click', () => toc?.removeAttribute('open')));

// ---------- One scroll handler for everything that reacts to scrolling ----------
function onScroll() {
	const y = window.scrollY;
	toTop.classList.toggle('show', y > 600);

	if (isCaseStudy) {
		const max = root.scrollHeight - window.innerHeight;
		root.style.setProperty('--progress', String(max > 0 ? Math.min(1, y / max) : 0));
	}

	updateActive();
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();
