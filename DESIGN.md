# Portfolio design reference

The portfolio is a single scrolling page at `/`. Its visual system uses white surfaces, near-black ink, and a deep blue accent. Pixel details come from the brand mark and square geometry in the controls.

## Color, type, and layout

| Role                                           | Value                |
| ---------------------------------------------- | -------------------- |
| Navigation rail and mobile panel               | White `#fff`         |
| Navigation ink                                 | Near-black `#111216` |
| Primary actions, current navigation, and focus | Blue `#1d2f80`       |
| Navigation hover                               | Pale blue `#edf0fa`  |
| Navigation rules                               | Blue-gray `#d5daeb`  |

- Use Manrope for navigation, headings, and body text. Use DM Mono for compact metadata and technical labels.
- Align the rail to the portfolio content gutter and cap its inner width at `74rem`.
- Keep interactive surfaces square, with straight dividers and hard-edged state changes. Use blue fills with white text for selection. The current navigation link adds a small square marker.
- Keep project, résumé, toolbox, and contact content in readable sections with clear headings and a consistent layout rhythm.

## Navigation

- The white rail stays sticky at the top in normal document flow. It measures 76px on desktop and 60px below `48rem`.
- Desktop exposes the portfolio links in one row. Mobile uses an outlined Menu control with a native disclosure and a full-width white panel of ruled links. The control reads Close while expanded.
- The brand links to `#top`. Work, About, Résumé, Toolbox, and Contact use `#selected-work`, `#about`, `#resume`, `#toolbox`, and `#contact`. Keep those fragment links native so direct URLs, scroll, and browser history work together.
- The section in view is indicated visually and via `aria-current="location"`. Keyboard focus uses a visible blue outline. Leave room for the rail above anchored content.
- Keep controls at least 44px high. Escape closes the mobile disclosure and returns focus to its summary. Link activation closes it and lets the browser navigate to the section.

The header is implemented in `components/portfolio/portfolio-header.tsx` and `components/portfolio/portfolio-header.module.css`. Stamp is a separate app at `/stamp` with its own interface.
