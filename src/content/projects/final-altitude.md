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
coverImage: "/portfolio/images/final-altitude/cover.jpg"
---

## Movement feel

<div class="card">

**Result:** Snappy, controllable and fast movement, feeling similar to a dragonfly's. Top speed is 30 and it takes 0.25 s to stop.

**Problem:** Movement felt too slippery, it was hard to stop where you wanted to. Stopping while sprinting is even harder with 4x the stopping distance.

**Solution:** Adjusted acceleration and deceleration values and used the sprint speed multiplier on both so that it scaled based on what was going on.

</div>

<div class="variants" data-variants>
<figure class="variants-stage">
<div class="variants-frame">
<video class="variants-video active" src="/portfolio/videos/final-altitude/decel-20.mp4" autoplay loop muted playsinline preload="auto" aria-label="Ship flying with deceleration 20"></video>
<video class="variants-video" src="/portfolio/videos/final-altitude/decel-200.mp4" loop muted playsinline preload="auto" aria-hidden="true" aria-label="Ship flying with deceleration 200"></video>
</div>
<figcaption>Deceleration 20: stops in 1.5 s over 22.5 m.</figcaption>
</figure>
<div class="variants-tabs" role="group" aria-label="Choose a version">
<button type="button" class="variant active" aria-pressed="true" data-src="/portfolio/videos/final-altitude/decel-20.mp4" data-caption="Deceleration 20: stops in 1.5 s over 22.5 m.">Deceleration 20</button>
<button type="button" class="variant" aria-pressed="false" data-src="/portfolio/videos/final-altitude/decel-200.mp4" data-caption="Deceleration 200: stops in 0.15 s over 2.25 m.">Deceleration 200</button>
</div>
</div>

<details class="accordion">
<summary>Values I tested</summary>
<div class="card">

| Deceleration | Stop time | Stop distance | Feel |
|---|---|---|---|
| 20 | 1.5 s | 22.5 m | Much more slippery. Hard to stop in the right place. |
| 60 | 0.5 s | 7.5 m | Slippery but mostly controllable. |
| 200 | 0.15 s | 2.25 m | Significantly snappier. Control greatly increased. |

*Top speed 30 and acceleration 90 in every test. Stop times and distances are calculated, not measured.*

</div>
</details>
