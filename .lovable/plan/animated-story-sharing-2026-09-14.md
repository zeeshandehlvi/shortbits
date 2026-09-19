# Animated story sharing

## Goal
Make every visible share control open a polished, animated sharing menu for the current article.

## Experience
- Add a compact floating menu that flows outward from the share button with WhatsApp, Facebook, X, and LinkedIn actions.
- Add a copy-link action that changes to a checkmark and “Copied” confirmation after success.
- Use the native device share sheet when appropriate, while keeping the social options available as direct links.
- Close the menu when tapping outside, pressing Escape, changing stories, or choosing a share destination.
- Apply the interaction to mobile cards, mobile article pages, and the desktop article view.

## Technical details
- Build one reusable share control using the existing icon-button styling and semantic color tokens.
- Generate a stable article URL with a story identifier and include the article headline in share text.
- Use Clipboard API with a safe fallback when clipboard access is unavailable.
- Add short staggered scale/slide animations, accessible labels, keyboard focus, and reduced-motion support.

## Validation
- Verify opening, closing, social links, copy confirmation, and story-specific URLs on mobile and desktop.
- Confirm the menu stays above cards without clipping or overlap and the preview builds cleanly.
