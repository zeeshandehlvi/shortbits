# Qadian Times mobile news experience

## Goal
Build a mobile-only news interface matching the supplied reference: a soft frosted home feed with stacked swipeable cards, an all-news list, and a full article view.

## Screens and interactions
1. **Home screen**
   - Recreate the compact status/header area, date, “News Hub” title, search and notification controls.
   - Add category pills for All News, Sports, World, and Business.
   - Build a layered card deck where the next stories remain visibly offset behind the active story.
   - Support touch dragging and left/right swipes with smooth snapping, depth, and card-order transitions.
   - Include story publisher, verification mark, age, menu, headline, image, reactions, comments, views, and share controls.
   - Match the floating four-item bottom navigation and active green home state.

2. **All news screen**
   - Open from “See All” and the news navigation item.
   - Recreate the centered title, back/menu controls, and vertically scrollable large story cards.
   - Preserve the reference’s compact spacing, white card surfaces, rounded images, and soft green page wash.

3. **Full article screen**
   - Open when a story card is tapped.
   - Recreate the edge-to-edge cover image, translucent top controls, rounded white article sheet, publisher row, share action, headline, metadata, author/source/likes row, divider, and body copy.
   - Keep the reading view vertically scrollable and return navigation functional.

## Visual system
- Use the uploaded composition strictly as a visual reference, not as an embedded image.
- Match its near-white glass surfaces, pale mint background, black typography, restrained red publisher accents, thin borders, and soft shadows.
- Use a clean geometric sans-serif with bold editorial headlines and precisely tuned mobile spacing.
- Create cohesive editorial imagery for the sample stories so every state looks complete.
- Optimize the experience for phone widths only; wider previews will center a fixed-width phone canvas rather than become a desktop layout.

## Technical details
- Replace the placeholder home page with one React experience containing the three navigable states.
- Use the existing carousel library for accessible touch/drag behavior and keyboard fallback.
- Use semantic design tokens in the global stylesheet and reusable controls/cards for visual consistency.
- Add unique home-page title, description, Open Graph, and Twitter metadata.
- Respect reduced-motion preferences and provide labels, focus states, and descriptive image alt text.

## Validation
- Verify at a representative mobile viewport against the reference composition.
- Test swiping, category selection, “See All,” opening an article, back navigation, bottom navigation, and scrolling.
- Check that no text, controls, stacked cards, or images overlap or clip, then confirm the preview builds without errors.