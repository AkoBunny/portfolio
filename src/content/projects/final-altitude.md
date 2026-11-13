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

**Result:** Snappy, controllable movement that still feels like it's moving fast. Top speed is 30 and it takes 0.25 s to stop.

**Problem:** Movement felt too slippery, it was hard to stop where you wanted to. Stopping while sprinting is even harder with 4x the stopping distance.

**Solution:** Adjusted acceleration and deceleration values and used the sprint speed multiplier on both so that it scaled based on what was going on.

</div>

<div class="compare" tabindex="0" role="slider" aria-label="Before and after comparison: floor without and with a grid" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
<img class="compare-before" src="/portfolio/images/final-altitude/grid-before.jpg" alt="Before: a flat grey floor with no markings, so speed and distance are hard to judge">
<img class="compare-after" src="/portfolio/images/final-altitude/grid-after.jpg" alt="After: the same view with a 1 m grid floor that gives a clear reference for speed and distance">
<span class="compare-handle"></span>
</div>

*Without a grid it wasn't easy to tell how far the character travelled before stopping. The 1 m grid gives a quick reference for the stopping distance.*

<figure class="media">
<video src="/portfolio/videos/final-altitude/decel-comparison.mp4" autoplay loop muted playsinline aria-label="Four deceleration values side by side: 200 stops in 2.25 m, 120 (chosen) in 3.75 m, 60 in 7.5 m, 20 in 22.5 m"></video>
<figcaption>All four values at once, from the same top speed. 120 is the one I kept.</figcaption>
</figure>

<details class="accordion">
<summary>Values I tested</summary>
<div class="card">

| Deceleration | Stop time | Stop distance | Feel |
|---|---|---|---|
| 200 | 0.15 s | 2.25 m | Significantly snappier. Control greatly increased. |
| 120 (chosen) | 0.25 s | 3.75 m | Snappy and controllable, while still feeling fast. |
| 60 | 0.5 s | 7.5 m | Slippery but mostly controllable. |
| 20 | 1.5 s | 22.5 m | Much more slippery. Hard to stop in the right place. |

*Top speed 30 and acceleration 90 in every test, with the same recorded input. Stop distances are measured in-game; stop times are calculated (speed ÷ deceleration).*

</div>
</details>