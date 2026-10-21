// Motion extras: the ambient petals and sparkles drifting in the margins.
//
// The site changes pages without reloading, so this file runs once and the petal layer
// simply carries on drifting while pages change underneath it.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// ---------- Ambient petals and sparkles ----------
// A small, permanent set of particles (a "pool"). Instead of creating and deleting
// them, each one is recycled: when it falls off the bottom it jumps back to the top.

type Mote = {
	el: HTMLElement;
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

const motes: Mote[] = [];
let leftGutter: [number, number] = [0, 0]; // the empty margins, as [from, to] in px
let rightGutter: [number, number] = [0, 0];
let ambientOn = false;
let ambientRunning = false;
let ambientLast = 0;
let ambientTime = 0;

for (let i = 0; i < 16; i++) {
	const sparkle = i % 4 === 3; // every fourth one is a sparkle
	const el = document.createElement('span');
	el.className = `mote ${sparkle ? 'mote-sparkle' : 'mote-petal'}`;
	const size = sparkle ? 10 + Math.random() * 8 : 12 + Math.random() * 10;
	el.style.width = `${size}px`;
	el.style.height = `${size}px`;
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
	const vh = window.innerHeight;

	motes.forEach((m) => {
		m.y += m.fall * dt;
		m.rot += m.spin * dt;

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
	main = document.querySelector<HTMLElement>('main');
	measure();
});
window.addEventListener('resize', measure);
window.addEventListener('load', measure);

// Marks this file as a module, so its names don't clash with other scripts in the editor
export {};
