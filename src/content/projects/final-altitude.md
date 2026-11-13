---
title: "Final Altitude"
hook: "Fast-paced aerial combat PvE game about a war between Humans and Dwarves"
category: ["Gameplay Design"]
status: "In Progress"
type: "Coursework"
featured: true
date: 2026-09-22
duration: "12 weeks"
engine: "Unity"
tools: ["Visual Studio", "Git"]
genre: "Flight combat"
role: "Gameplay designer and programmer"
teamSize: "1"
coverImage: "/portfolio/images/final-altitude/grid-after.jpg"
---

## Movement feel

<div class="card">

**Result:** Snappy, controllable and fast movement, feeling similar to a dragonfly's. Top speed is 30 and it takes 0.25 s to stop.

**Problem:** Movement felt too slippery, it was hard to stop where you wanted to. Stopping while sprinting is even harder with 4x the stopping distance.

**Solution:** Adjusted acceleration and deceleration values and used the sprint speed multiplier on both so that it scaled based on what was going on.

</div>

<figure class="media">
<video src="/portfolio/videos/final-altitude/decel-comparison.mp4" autoplay loop muted playsinline aria-label="Four deceleration values side by side: 200 stops in 2.25 m, 120 (chosen) in 3.75 m, 60 in 7.5 m, 20 in 22.5 m"></video>
<figcaption>All four values at once, from the same top speed. 120 is the one I kept.</figcaption>
</figure>

<div class="variants" data-variants>
<figure class="variants-stage">
<div class="variants-frame">
<video class="variants-video active" src="/portfolio/videos/final-altitude/decel-120.mp4" autoplay loop muted playsinline preload="auto" aria-label="The character flying and stopping with deceleration 120"></video>
<video class="variants-video" src="/portfolio/videos/final-altitude/decel-200.mp4" loop muted playsinline preload="auto" aria-hidden="true" aria-label="The character flying and stopping with deceleration 200"></video>
<video class="variants-video" src="/portfolio/videos/final-altitude/decel-60.mp4" loop muted playsinline preload="auto" aria-hidden="true" aria-label="The character flying and stopping with deceleration 60"></video>
<video class="variants-video" src="/portfolio/videos/final-altitude/decel-20.mp4" loop muted playsinline preload="auto" aria-hidden="true" aria-label="The character flying and stopping with deceleration 20"></video>
</div>
<figcaption>Deceleration 120 (chosen): stops in 0.25 s over 3.75 m.</figcaption>
</figure>
<div class="variants-tabs" role="group" aria-label="Choose a deceleration value">
<button type="button" class="variant active" aria-pressed="true" data-src="/portfolio/videos/final-altitude/decel-120.mp4" data-caption="Deceleration 120 (chosen): stops in 0.25 s over 3.75 m.">Deceleration 120 (chosen)</button>
<button type="button" class="variant" aria-pressed="false" data-src="/portfolio/videos/final-altitude/decel-200.mp4" data-caption="Deceleration 200: stops in 0.15 s over 2.25 m.">Deceleration 200</button>
<button type="button" class="variant" aria-pressed="false" data-src="/portfolio/videos/final-altitude/decel-60.mp4" data-caption="Deceleration 60: stops in 0.5 s over 7.5 m.">Deceleration 60</button>
<button type="button" class="variant" aria-pressed="false" data-src="/portfolio/videos/final-altitude/decel-20.mp4" data-caption="Deceleration 20: stops in 1.5 s over 22.5 m.">Deceleration 20</button>
</div>
</div>

<div class="card draft">

**Draft: why 120?** Write 2 or 3 short lines in your own words. What did 200 feel like to fly, and why not keep it? Why was 20 too slippery? What made 120 the right middle ground?

</div>

<details class="accordion">
<summary>Values I tested</summary>
<div class="card">

| Deceleration | Stop time | Stop distance | Feel |
|---|---|---|---|
| 200 | 0.15 s | 2.25 m | Significantly snappier. Control greatly increased. |
| 120 (chosen) | 0.25 s | 3.75 m | *Draft: how 120 felt, in your words.* |
| 60 | 0.5 s | 7.5 m | Slippery but mostly controllable. |
| 20 | 1.5 s | 22.5 m | Much more slippery. Hard to stop in the right place. |

*Top speed 30 and acceleration 90 in every test, with the same recorded input. Stop distances are measured in-game; stop times are calculated (speed ÷ deceleration).*

</div>
</details>

## Readable distances

<div class="compare" tabindex="0" role="slider" aria-label="Before and after comparison: floor without and with a grid" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
<img class="compare-before" src="/portfolio/images/final-altitude/grid-before.jpg" alt="Before: a flat grey floor with no markings, so speed and distance are hard to judge">
<img class="compare-after" src="/portfolio/images/final-altitude/grid-after.jpg" alt="After: the same view with a 1 m grid floor that gives a clear reference for speed and distance">
<span class="compare-handle"></span>
</div>

*Drag across the image (or use the left and right arrow keys) to compare the plain floor with the 1 m grid.*

<div class="card draft">

**Draft: why the grid?** Write 1 or 2 short lines in your own words. What was hard to judge on the plain floor? What does the 1 m grid let you (and the viewer) see now?

</div>