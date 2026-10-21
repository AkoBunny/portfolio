// Click-to-play video posters.
//
// Home shows a poster image with a play button instead of loading a real YouTube player
// straight away. Loading a player on every page view is slow, and the player flashes white
// or black each time the page changes. When someone clicks the poster, we swap in the
// real player and start it.
//
// Event delegation: one listener on the whole document, so it keeps working after page changes.

document.addEventListener('click', (event) => {
	const poster = (event.target as HTMLElement).closest<HTMLElement>('.video-poster');
	if (!poster) return;

	const box = poster.closest<HTMLElement>('[data-video]');
	const id = box?.dataset.video;
	if (!box || !id) return;

	const iframe = document.createElement('iframe');
	iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
	iframe.title = poster.getAttribute('aria-label') ?? 'Video player';
	iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
	iframe.allowFullscreen = true;
	poster.replaceWith(iframe);
});

// Warm up the connection to YouTube the first time the pointer reaches a poster
let warmed = false;
document.addEventListener('pointerover', (event) => {
	if (warmed || !(event.target as HTMLElement).closest('.video-poster')) return;
	warmed = true;
	for (const href of ['https://www.youtube-nocookie.com', 'https://i.ytimg.com']) {
		const link = document.createElement('link');
		link.rel = 'preconnect';
		link.href = href;
		document.head.appendChild(link);
	}
});

// Marks this file as a module, so its names don't clash with other scripts in the editor
export {};
