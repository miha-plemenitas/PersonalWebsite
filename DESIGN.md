# Design system

The portfolio uses a restrained editorial style with cues from product directories: oversized typography, numbered labels, compact indexes, thin rules, and content arranged in clear rows. The ArtCraft Crafting Apps page is an inspiration for this structure, adapted to Miha’s portfolio and visual identity.

## Visual direction

- **Palette:** warm paper `#f7f6f2`, deep ink `#1d211d`, and burgundy `#a61b45`. Dark mode uses near-black surfaces and warm white text. Keep burgundy as the main accent in both themes.
- **Typography:** Manrope for display and body text; DM Mono for metadata, section numbers, and technical labels.
- **Shape language:** square corners, thin borders, straight dividers, crisp grid cells, and minimal shadows. Avoid pill shapes and ornamental rounding in new components.
- **Layout:** centered content capped at 1120px, generous vertical spacing, clear two-column desktop compositions, and responsive layouts that simplify on mobile.
- **Texture:** no page-wide gradient or background grid. The animated building-block illustration may use its own square grid as a contained visual.
- **Emphasis:** use burgundy for key words, section markers, links, selected states, and primary actions. Keep surrounding surfaces monochrome.

## Theme and navigation

- Follow the device’s light or dark preference by default on desktop and mobile.
- The header toggle switches directly between light and dark and remembers the visitor’s explicit choice.
- The fixed header gains a solid, lightly blurred surface after scrolling and hides while scrolling down; scrolling up reveals it.
- Desktop navigation stays compact and uppercase. Mobile navigation opens as a full-width, square-edged panel with ruled links.
- Keep the theme control and mobile menu aligned in the header and usable by keyboard and touch.

## Motion

- Use short, restrained transitions to clarify state: staggered content reveals, slight link and card responses, arrow movement, and crisp tile feedback.
- The hero illustration assembles square blocks with a snap-like motion. Puzzle answers use a short rectangular reveal; tile selection and success states use clear color and outline changes.
- Avoid bounce, elastic movement, decorative rotation, large floating effects, and excessive blur.
- Respect `prefers-reduced-motion`: remove nonessential animation and transitions and show reveal content immediately.

## Page patterns

- **Home:** the first screen features the full quote “Life is short, but the craft is long.” credited to Hippocrates, a concise introduction, clear calls to action, and the contained block illustration.
- **About, Work, and ToolBox:** reuse numbered editorial headings, consistent page rhythm, compact indexes, and thin dividers.
- **Projects:** present role, dates, description, technologies, and navigation in structured rows or square-edged case cards.
- **Résumé:** use a timeline for education and experience, with a compact skills grid.
- **ToolBox:** keep games and utilities consistent with the black, white, and burgundy palette. Use square tiles, buttons, controls, and feedback states.
- **Footer:** keep contact links, brand mark, and location details concise and easy to scan.

## Accessibility and content

- Keep visible focus indicators and keyboard navigation usable.
- Give every form control a visible or accessible label.
- Pair color with text, shape, or position when communicating status.
- Preserve readable contrast in both themes, including generated QR codes.
- Keep descriptions concise and direct, and make interactive targets comfortable on touch screens.
