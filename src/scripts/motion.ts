// Motion extras: the ambient petals and sparkles drifting in the margins.
//
// The site changes pages without reloading, so this file runs once and the petal layer
// simply carries on drifting while pages change underneath it.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// ---------- Ambient petals and sparkles ----------
// Each one is a tiny inline SVG drawing (not a CSS mask), which keeps the edges clean in every browser.
// A small, permanent set of particles (a "pool"). Instead of creating and deleting
// them, each one is recycled: when it falls off the bottom it jumps back to the top.

type Mote = {
	el: SVGSVGElement;
	sparkle: boolean;
	left: boolean; // which margin it lives in
	baseX: number; // the centre line it sways around (px)
	y: number;
	fall: number; // fall speed (px per second)
	amp: number; // sway distance (px)
	freq: number; // sway speed
	phase: number; // so they don't all sway in step
	rot: number;
	spin: number; // degrees per second
	opacity: number;
};

let main = document.querySelector<HTMLElement>('main');
const layer = document.createElement('div');
layer.className = 'ambient';
layer.setAttribute('aria-hidden', 'true');

// <body> is replaced on every page change, so the layer is put back each time
document.body.appendChild(layer);
document.addEventListener('astro:after-swap', () => document.body.appendChild(layer));

const SVG_NS = 'http://www.w3.org/2000/svg';
const PETAL_PATH =
	'M12 12C7.8 9.6 7.6 4.6 10.2 3.2C11 2.8 11.6 3.3 12 4C12.4 3.3 13 2.8 13.8 3.2C16.4 4.6 16.2 9.6 12 12Z';
const SPARKLE_PATH = 'M12 2C12.8 8 16 11.2 22 12C16 12.8 12.8 16 12 22C11.2 16 8 12.8 2 12C8 11.2 11.2 8 12 2Z';

const motes: Mote[] = [];
let leftGutter: [number, number] = [0, 0]; // the empty margins, as [from, to] in px
let rightGutter: [number, number] = [0, 0];
let ambientOn = false;
let ambientRunning = false;
let ambientLast = 0;
let ambientTime = 0;

// Scroll reaction: the petals fall faster while you scroll down and slow down while you scroll up.
let lastScrollY = window.scrollY;
let scrollSpeed = 0; // smoothed scroll speed in px per second (down is positive)
const SCROLL_PUSH = 0.12; // how strongly scrolling pushes the petals
const SCROLL_EASE = 0.18; // seconds the push takes to catch up with your scrolling; bigger = lazier

for (let i = 0; i < 16; i++) {
	const sparkle = i % 4 === 3; // every fourth one is a sparkle
	const size = (sparkle ? 10 + Math.random() * 8 : 12 + Math.random() * 10) * 0.88;
	const el = document.createElementNS(SVG_NS, 'svg');
	el.setAttribute('class', 'mote');
	el.setAttribute('viewBox', sparkle ? '0 0 24 24' : '7 2 10 11');
	el.setAttribute('width', String(size));
	el.setAttribute('height', String(size));

	// Petals use the palette gradient (each drawing carries its own copy of it); sparkles use the accent colour
	const shape = document.createElementNS(SVG_NS, 'path');
	shape.setAttribute('d', sparkle ? SPARKLE_PATH : PETAL_PATH);
	if (sparkle) {
		shape.setAttribute('style', 'fill: var(--accent)');
	} else {
		const gradientId = `mote-gradient-${i}`;
		el.innerHTML = `<defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color: var(--accent-2)"/><stop offset="1" style="stop-color: var(--accent)"/></linearGradient></defs>`;
		shape.setAttribute('style', `fill: url(#${gradientId})`);
	}
	el.appendChild(shape);
	layer.appendChild(el);

	motes.push({
		el,
		sparkle,
		left: i % 2 === 0,
		baseX: 0,
		y: Math.random() * window.innerHeight,
		fall: sparkle ? 8 + Math.random() * 12 : 18 + Math.random() * 22,
		amp: 14 + Math.random() * 26,
		freq: 0.4 + Math.random() * 0.5,
		phase: Math.random() * Math.PI * 2,
		rot: Math.random() * 360,
		spin: (Math.random() - 0.5) * 40,
		opacity: sparkle ? 0.5 : 0.14 + Math.random() * 0.12,
	});
}

// Pick a new sideways position for a particle inside its margin
function placeX(m: Mote) {
	const [from, to] = m.left ? leftGutter : rightGutter;
	m.baseX = from + m.amp + Math.random() * Math.max(0, to - from - m.amp * 2);
}

// Work out how much empty space there is either side of the content
function measure() {
	const vw = document.documentElement.clientWidth;
	let contentLeft = 0;
	let contentRight = vw;

	if (main) {
		const rect = main.getBoundingClientRect();
		const pad = parseFloat(getComputedStyle(main).paddingLeft) || 0;
		contentLeft = rect.left + pad;
		contentRight = rect.right - pad;
	}

	// Only move the particles if the margins really changed (a window resize), not on every page change
	const moved = Math.abs(contentLeft - 24 - leftGutter[1]) > 4 || Math.abs(contentRight + 24 - rightGutter[0]) > 4;
	leftGutter = [8, contentLeft - 24];
	rightGutter = [contentRight + 24, vw - 8];

	// Only show them when both margins are wide enough to be worth it
	const roomy = leftGutter[1] - leftGutter[0] > 60 && rightGutter[1] - rightGutter[0] > 60;
	ambientOn = roomy && !reduceMotion.matches;
	layer.style.display = ambientOn ? '' : 'none';
	if (moved) motes.forEach(placeX);

	if (ambientOn && !ambientRunning) {
		ambientRunning = true;
		ambientLast = performance.now();
		lastScrollY = window.scrollY;
		requestAnimationFrame(ambientTick);
	}
}

function ambientTick(now: number) {
	if (!ambientOn) {
		ambientRunning = false;
		return;
	}

	const dt = Math.min((now - ambientLast) / 1000, 0.05);
	ambientLast = now;
	ambientTime += dt;

	// How fast is the page scrolling right now? Distance moved this frame divided by the time.
	// Jumps (back-to-top, a page change) are capped so they don't fling the petals.
	const scrollNow = window.scrollY;
	const frameTime = Math.max(dt, 0.001);
	const rawScroll = Math.max(-3000, Math.min(3000, (scrollNow - lastScrollY) / frameTime));
	lastScrollY = scrollNow;

	// Ease towards that speed instead of copying it, so the petals build up speed and glide
	// to a stop. "Close a fraction of the gap every frame" is also how a lagging camera works.
	scrollSpeed += (rawScroll - scrollSpeed) * (1 - Math.exp(-frameTime / SCROLL_EASE));
	const vh = window.innerHeight;

	motes.forEach((m) => {
		// Scrolling down adds speed, scrolling up takes it away (down to a standstill, never
		// backwards). Faster petals react more, which gives a little depth.
		const speed = Math.max(0, m.fall + scrollSpeed * SCROLL_PUSH * (m.fall / 30));
		m.y += speed * dt;
		m.rot += m.spin * (speed / m.fall) * dt;

		// Fell off the bottom: recycle it at the top, in a new spot
		if (m.y > vh + 30) {
			m.y = -30;
			placeX(m);
		}

		const x = m.baseX + Math.sin(ambientTime * m.freq + m.phase) * m.amp;
		let opacity = m.opacity;
		let scale = 1;

		// Sparkles twinkle: size and brightness pulse together
		if (m.sparkle) {
			const twinkle = 0.5 + 0.5 * Math.sin(ambientTime * 1.6 + m.phase);
			opacity *= 0.3 + 0.7 * twinkle;
			scale = 0.6 + 0.4 * twinkle;
		}

		m.el.style.transform = `translate(${x}px, ${m.y}px) rotate(${m.rot}deg) scale(${scale})`;
		m.el.style.opacity = String(opacity);
	});

	requestAnimationFrame(ambientTick);
}

// Each page has its own <main>, so measure again whenever the page changes
document.addEventListener('astro:page-load', () => {
	lastScrollY = window.scrollY; // a page change resets the scroll position, which is not a scroll
	main = document.querySelector<HTMLElement>('main');
	measure();
});
window.addEventListener('resize', measure);
window.addEventListener('load', measure);

// Marks this file as a module, so its names don't clash with other scripts in the editor
export {};
