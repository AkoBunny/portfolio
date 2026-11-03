// Variant switcher: one frame, several video clips stacked on top of each other, and
// buttons that fade between them.
//
// Why stacked? Swapping a single video's file makes the browser throw away the old picture
// before the new one is ready, which shows as a flash. Here every clip is already loaded,
// so a switch is just a fade.
//
// The Markdown for it is a <div class="variants" data-variants> holding a .variants-frame
// with one <video> per version, a <figcaption>, and one <button class="variant"> per
// version (see final-altitude.md for an example). Each button carries data-src (it must
// match its video's src) and data-caption (the text shown under the video).
//
// Event delegation: one listener on the whole document, so it keeps working after
// page changes (the same trick video.ts uses).

const FADE_MS = 300; // keep in step with the opacity transition in extras.css

// Each leaving video gets a timer that pauses it once the fade is over
const pauseTimers = new WeakMap<HTMLVideoElement, number>();

document.addEventListener('click', (event) => {
	const button = (event.target as HTMLElement).closest<HTMLButtonElement>('.variant');
	if (!button) return;

	const box = button.closest<HTMLElement>('[data-variants]');
	if (!box) return;

	const videos = Array.from(box.querySelectorAll<HTMLVideoElement>('video'));
	const next = videos.find((video) => video.getAttribute('src') === button.dataset.src);
	const previous = videos.find((video) => video.classList.contains('active'));
	if (!next || next === previous) return;

	// Light up the clicked button, dim the others
	box.querySelectorAll<HTMLButtonElement>('.variant').forEach((other) => {
		const isThis = other === button;
		other.classList.toggle('active', isThis);
		other.setAttribute('aria-pressed', String(isThis));
	});

	// Bring the new clip in: restart it from the beginning, then fade it in on top
	window.clearTimeout(pauseTimers.get(next));
	next.classList.remove('leaving');
	next.removeAttribute('aria-hidden');
	next.currentTime = 0;
	next.play().catch(() => {
		// Some browsers block autoplay. The clip stays on its first frame.
	});
	next.classList.add('active');

	// The old clip stays fully visible underneath until the new one has faded in
	// (so the middle of the fade never dips dark), then it stops playing
	if (previous) {
		previous.classList.remove('active');
		previous.classList.add('leaving');
		previous.setAttribute('aria-hidden', 'true');
		pauseTimers.set(
			previous,
			window.setTimeout(() => {
				previous.classList.remove('leaving');
				previous.pause();
			}, FADE_MS + 50),
		);
	}

	const caption = box.querySelector<HTMLElement>('figcaption');
	if (caption && button.dataset.caption) caption.textContent = button.dataset.caption;
});

// Marks this file as a module, so its names don't clash with other scripts in the editor
export {};
