// Decoration scripts shared by every page: the soft scroll-in and the petal burst.

// ---------- Soft scroll-in ----------
// An IntersectionObserver is a browser feature that tells you when an element
// enters the screen. When a ".reveal" element does, we add class "in" (the CSS
// does the fading) and stop watching it.
const revealObserver = new IntersectionObserver(
	(entries) => {
		entries.forEach((entry) => {
			if (!entry.isIntersecting) return;
			entry.target.classList.add('in');
			revealObserver.unobserve(entry.target);
		});
	},
	{ threshold: 0.12 },
);

// Home page panels already carry class "reveal" in their markup
document.querySelectorAll<HTMLElement>('.reveal').forEach((item) => revealObserver.observe(item));

// Case-study content comes from Markdown, so we add the class from here. Only blocks
// that start below the visible screen get it, so nothing flashes on load.
function revealCaseStudy() {
	document.querySelectorAll<HTMLElement>('.case-study > *').forEach((block) => {
		if (block.getBoundingClientRect().top < window.innerHeight) return;
		block.classList.add('reveal');
		revealObserver.observe(block);
	});
}

// Wait until the page has fully loaded, because the gallery script rearranges its
// images and we want to see the final layout
if (document.readyState === 'complete') revealCaseStudy();
else window.addEventListener('load', revealCaseStudy);
// ---------- Petal burst (a small particle system) ----------
// Each petal is a bundle of numbers: where it is, how fast it is moving, how it
// is spinning, how old it is. Every frame we update those numbers and draw it.

type Petal = {
	el: HTMLElement;
	x: number; // position on screen (px)
	y: number;
	vx: number; // velocity (px per second)
	vy: number;
	rot: number; // rotation (degrees)
	spin: number; // rotation speed (degrees per second)
	age: number; // seconds alive so far
	life: number; // seconds until it is removed
	phase: number; // offsets the sway so petals don't wobble in lockstep
};

const GRAVITY = 260; // pulls petals down
const DRAG = 2.2; // air resistance: slows a petal in proportion to its speed
const SWAY = 90; // strength of the sideways wobble
const PETAL_COUNT = 26;

const petals: Petal[] = [];
let lastTime = 0;
let running = false;

function burst(x: number, y: number) {
	for (let i = 0; i < PETAL_COUNT; i++) {
		const el = document.createElement('span');
		el.className = 'petal';
		const size = 11 + Math.random() * 12;
		el.style.width = `${size}px`;
		el.style.height = `${size}px`;
		document.body.appendChild(el);

		// Fire in a fan shape, mostly upwards, at a random speed
		const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
		const speed = 300 + Math.random() * 400;

		petals.push({
			el,
			x,
			y,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed,
			rot: Math.random() * 360,
			spin: (Math.random() - 0.5) * 540,
			age: 0,
			life: 1.8 + Math.random() * 1.4,
			phase: Math.random() * Math.PI * 2,
		});
	}

	// Start the loop if it is not already running
	if (!running) {
		running = true;
		lastTime = performance.now();
		requestAnimationFrame(tick);
	}
}

// The update loop. The browser calls this before every screen refresh.
function tick(now: number) {
	// dt = seconds since the last frame. Using it means petals move at the same
	// real speed on a 60 Hz and a 144 Hz screen. The cap stops a huge jump if the
	// tab was in the background.
	const dt = Math.min((now - lastTime) / 1000, 0.05);
	lastTime = now;

	// Count backwards so removing a petal doesn't skip the next one
	for (let i = petals.length - 1; i >= 0; i--) {
		const p = petals[i];
		p.age += dt;

		if (p.age >= p.life) {
			p.el.remove();
			petals.splice(i, 1);
			continue;
		}

		// Forces change velocity...
		p.vy += GRAVITY * dt;
		p.vx += Math.sin(p.age * 6 + p.phase) * SWAY * dt;
		p.vx -= p.vx * DRAG * dt;
		p.vy -= p.vy * DRAG * dt;

		// ...and velocity changes position
		p.x += p.vx * dt;
		p.y += p.vy * dt;
		p.rot += p.spin * dt;

		// Fully visible for the first 60% of its life, then fade out
		const t = p.age / p.life;
		const opacity = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;

		p.el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) rotate(${p.rot}deg)`;
		p.el.style.opacity = String(opacity);
	}

	if (petals.length > 0) requestAnimationFrame(tick);
	else running = false;
}

// Anything with a data-petals attribute showers petals when clicked
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

document.addEventListener('click', (event) => {
	const trigger = (event.target as HTMLElement).closest<HTMLElement>('[data-petals]');
	if (!trigger) return;

	// The avatar is also the "home" link. If we are already home, shower petals
	// and scroll to the top instead of reloading the page.
	const onHome = location.pathname.replace(/\/$/, '') === '/portfolio';
	if (trigger.closest('a') && onHome) {
		event.preventDefault();
		window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
	}

	if (reduceMotion.matches) return;

	const rect = trigger.getBoundingClientRect();
	burst(rect.left + rect.width / 2, rect.top + rect.height / 2);
});
