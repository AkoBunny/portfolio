// Drag-to-change-slide for the Home carousel and the case-study galleries.
//
// Instead of letting the browser "fling" a scroll row (which can carry it past several
// slides), we handle the drag ourselves with pointer events, so mouse, touch and pen all
// behave the same: drag, let go, and it moves exactly ONE slide (or stays put).
//
// This is a small input state machine:
//   idle -> pressed (pointer went down) -> dragging (moved sideways enough) -> released
//
// It is delegated (one listener on the whole document) so it keeps working after page
// changes. It does not touch the image viewer's own drag handling, which lives on the
// viewer's stage and is separate from these slider rows.

const SELECTOR = '.carousel-track, .gallery';
const DRAG_START = 6; // px of movement before we decide whether this is a drag
const DISTANCE = 0.2; // drag further than this fraction of a slide and it changes slide
const FLICK = 0.4; // px per ms: a quick flick changes slide even over a short distance

type DragState = {
	track: HTMLElement;
	pointerId: number;
	startX: number;
	startY: number;
	startScroll: number;
	startIndex: number;
	step: number; // distance from one slide to the next (slide width + gap)
	count: number;
	dragging: boolean;
	samples: { x: number; t: number }[]; // recent pointer positions, to measure speed
};

let drag: DragState | null = null;
let suppressClick = false;
let settleTimer: number | undefined;
let lastTrack: HTMLElement | null = null;

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Put the row back to normal: re-enable the browser's own snapping
function settle(track: HTMLElement | null) {
	if (!track) return;
	track.style.scrollSnapType = '';
	track.classList.remove('is-dragging');
}

document.addEventListener('pointerdown', (event) => {
	if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;

	const track = (event.target as HTMLElement).closest<HTMLElement>(SELECTOR);
	if (!track) return;

	const slides = Array.from(track.children) as HTMLElement[];
	if (slides.length < 2) return;

	// If the previous drag is still settling, finish it first
	window.clearTimeout(settleTimer);
	settle(lastTrack);

	const step = slides[1].offsetLeft - slides[0].offsetLeft;
	if (step <= 0) return;

	drag = {
		track,
		pointerId: event.pointerId,
		startX: event.clientX,
		startY: event.clientY,
		startScroll: track.scrollLeft,
		startIndex: Math.round(track.scrollLeft / step),
		step,
		count: slides.length,
		dragging: false,
		samples: [{ x: event.clientX, t: event.timeStamp }],
	};
});

document.addEventListener('pointermove', (event) => {
	if (!drag || event.pointerId !== drag.pointerId) return;

	const dx = event.clientX - drag.startX;
	const dy = event.clientY - drag.startY;

	if (!drag.dragging) {
		// Mostly up/down: it's a normal page scroll, so leave it alone
		if (Math.abs(dy) > DRAG_START && Math.abs(dy) > Math.abs(dx)) {
			drag = null;
			return;
		}
		if (Math.abs(dx) < DRAG_START) return;

		// Mostly sideways: this is a drag. Take over from the browser.
		drag.dragging = true;
		drag.track.setPointerCapture(event.pointerId);
		drag.track.style.scrollSnapType = 'none'; // otherwise snapping fights our movement
		drag.track.classList.add('is-dragging');
	}

	// The row follows the pointer exactly
	drag.track.scrollLeft = drag.startScroll - dx;

	// Remember the last ~100 ms of movement so we can measure speed on release
	drag.samples.push({ x: event.clientX, t: event.timeStamp });
	while (drag.samples.length > 1 && event.timeStamp - drag.samples[0].t > 100) drag.samples.shift();
});

function release(event: PointerEvent) {
	if (!drag || event.pointerId !== drag.pointerId) return;
	const d = drag;
	drag = null;

	if (!d.dragging) return; // it was just a click or tap: leave it to the page

	const dx = event.clientX - d.startX;
	const first = d.samples[0];
	const speed = (event.clientX - first.x) / Math.max(1, event.timeStamp - first.t); // px per ms

	// Decide: far enough, or fast enough? Then change slide in that direction.
	let direction = 0;
	if (Math.abs(dx) > d.step * DISTANCE || Math.abs(speed) > FLICK) {
		direction = dx < 0 ? 1 : -1;
	}

	const target = Math.max(0, Math.min(d.count - 1, d.startIndex + direction));
	d.track.scrollTo({
		left: target * d.step,
		behavior: reduceMotion.matches ? 'auto' : 'smooth',
	});

	// Wait for the slide animation before switching the browser's snapping back on
	lastTrack = d.track;
	settleTimer = window.setTimeout(() => settle(d.track), 450);

	// A drag also produces a "click" when you let go, which would open a link or the image
	// viewer by accident. Swallow that one click.
	suppressClick = true;
	window.setTimeout(() => (suppressClick = false), 60);
}

document.addEventListener('pointerup', release);
document.addEventListener('pointercancel', release);

// "true" = capture phase, so this runs before anything else can react to the click
document.addEventListener(
	'click',
	(event) => {
		if (!suppressClick) return;
		event.preventDefault();
		event.stopPropagation();
	},
	true,
);

// Stop the browser starting its own "drag the link or image" ghost inside a slider row
document.addEventListener('dragstart', (event) => {
	if (event.target instanceof Element && event.target.closest(SELECTOR)) event.preventDefault();
});

// Marks this file as a module, so its names don't clash with other scripts in the editor
export {};
