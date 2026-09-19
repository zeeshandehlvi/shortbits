# Fluid swipe and gesture glass

## Goal
Make mobile news-card swipes feel smooth and physical, while progressively turning the active card into an opaque frosted-glass surface during dragging.

## Changes
- Track the gesture with animation frames so movement follows the finger without choppy React updates.
- Use a spring-like settle animation for completed swipes and cancelled gestures.
- Blend opacity, blur, saturation, card scale, rotation, and shadow according to drag distance.
- Let the cards behind subtly rise and sharpen as the front card moves away.
- Preserve current swipe directions, first-card boundary, pull-up action, card pagination, and article interactions.

## Validation
- Test slow drags, quick flicks, cancelled swipes, previous/next boundaries, and pull-up on a phone viewport.
- Confirm the card becomes progressively frosted while moving and returns cleanly when released.
- Confirm reduced-motion behavior and a clean build.
