// Behaviour of the "Other projects" carousel on Home.
//
// Clicks and scrolling use EVENT DELEGATION: one listener on the whole document handles
// whichever carousel is on the page at the time. Because it doesn't depend on elements
// that existed when the script first ran, it keeps working after page changes.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function slidesOf(track: HTMLElement) {
	return Array.from(track.children) as HTMLElement[];
}

// Distance from the start of one slide to the start of the next (slide width + gap)
function step(track: HTMLElement) {
	const slides = slidesOf(track);
	return slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth;
}

// Scrolled distance / step = which slide we are on
function currentIndex(track: HTMLElement) {
	const s = step(track);
	return s > 0 ? Math.round(track.scrollLeft / s) : 0;
}

// The % trick wraps around: before the first slide is the last, after the last is the first
function goTo(track: HTMLElement, index: number) {
	const count = slidesOf(track).length;
	const wrapped = (index + count) % count;
	track.scrollTo({
		left: wrapped * step(track),
		behavior: reduceMotion.matches ? 'auto' : 'smooth',
	});
}

// Make the dots and the "1 / 3" counter match the slide on screen
function refresh(carousel: HTMLElement) {
	const track = carousel.querySelector<HTMLElement>('.carousel-track');
	if (!track) return;
	const i = currentIndex(track);
	carousel.querySelectorAll('.carousel-dot').forEach((dot, n) => dot.classList.toggle('active', n === i));
	const counter = carousel.querySelector('.carousel-count');
	if (counter) counter.textContent = `${i + 1} / ${slidesOf(track).length}`;
}

document.addEventListener('click', (event) => {
	const target = event.target as HTMLElement;
	const carousel = target.closest<HTMLElement>('[data-carousel]');
	if (!carousel) return;
	const track = carousel.querySelector<HTMLElement>('.carousel-track');
	if (!track) return;

	const dot = target.closest('.carousel-dot');
	if (target.closest('.carousel-prev')) goTo(track, currentIndex(track) - 1);
	else if (target.closest('.carousel-next')) goTo(track, currentIndex(track) + 1);
	else if (dot) goTo(track, Array.from(carousel.querySelectorAll('.carousel-dot')).indexOf(dot));
});

// Scroll events don't bubble up, but they can be caught on the way down (capture)
document.addEventListener(
	'scroll',
	(event) => {
		const track = event.target;
		if (!(track instanceof HTMLElement) || !track.classList.contains('carousel-track')) return;
		const carousel = track.closest<HTMLElement>('[data-carousel]');
		if (carousel) refresh(carousel);
	},
	{ capture: true, passive: true },
);

// Give every title and hook the height of the tallest one, so the media frames line up
// from slide to slide
function equalise(track: HTMLElement) {
	for (const selector of ['.feature-title', '.feature-hook']) {
		const els = Array.from(track.querySelectorAll<HTMLElement>(selector));
		els.forEach((el) => (el.style.minHeight = ''));
		const tallest = Math.max(0, ...els.map((el) => el.offsetHeight));
		els.forEach((el) => (el.style.minHeight = `${tallest}px`));
	}
}

function equaliseAll() {
	document.querySelectorAll<HTMLElement>('[data-carousel] .carousel-track').forEach(equalise);
}

// Things that belong to the page currently showing
document.addEventListener('astro:page-load', () => {
	document.querySelectorAll<HTMLElement>('[data-carousel]').forEach((carousel) => {
		refresh(carousel);
		const track = carousel.querySelector<HTMLElement>('.carousel-track');
		if (track) new ResizeObserver(() => equalise(track)).observe(track);
	});
	equaliseAll();
	document.fonts.ready.then(equaliseAll);
});

// Marks this file as a module, so its names don't clash with other scripts in the editor
export {};
