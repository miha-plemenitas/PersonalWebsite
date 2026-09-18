# Design DNA

This document describes the current visual language of the personal website and ToolBox. It is a practical reference for extending the site without losing its character.

## Design idea

The site is warm, editorial, and quietly playful. It combines a calm paper-like canvas with dark ink typography, a single cherry-red accent, generous whitespace, and small moments of motion. The homepage is intentionally simple: one clear statement about making useful things, paired with a visual metaphor of blocks assembling into something practical.

Core principles:

- Make useful things feel approachable.
- Use whitespace and hierarchy instead of decoration to create clarity.
- Keep controls obvious, tactile, and accessible.
- Let cherry red mark action, energy, and moments worth noticing.
- Keep ToolBox focused: one tool, one clear job.

## Typography

### Primary typeface — Manrope

Manrope is used for body copy, navigation, labels, buttons, headings, and display text.

- Source: Google Fonts
- Weights loaded: 400, 500, 600, 700, 800
- Character: contemporary, friendly, geometric, and highly legible
- Body: regular weight with relaxed line-height
- Headings: 600–800 weight with tight tracking

Current usage:

- Display/headings: `font-display`, typically `font-semibold`, `tracking-[-.05em]`
- Body/navigation: `font-sans` or the base Manrope style
- Small labels: 500–600 weight

### Utility typeface — DM Mono

DM Mono is reserved for metadata and system-like labels:

- ToolBox category eyebrow text
- Section numbering
- Uppercase labels such as `Designer · Developer · Builder`
- Letter spacing: usually `tracking-[.15em]` to `tracking-[.2em]`
- Size: typically `text-xs`

Use it sparingly. It should add a technical/product feel without making the site feel like a terminal.

## Color palette

The palette is defined as CSS variables in `app/globals.css` and exposed as Tailwind colors.

| Token   | Hex       | Role                                                         |
| ------- | --------- | ------------------------------------------------------------ |
| `paper` | `#f7f6f2` | Main page canvas and soft input background                   |
| `ink`   | `#1d211d` | Primary text, dark buttons, high-contrast UI                 |
| `muted` | `#6c716b` | Supporting text, descriptions, secondary navigation          |
| `line`  | `#dedfd8` | Borders, dividers, and understated structure                 |
| `coral` | `#a61b45` | Cherry-red accent, links, active energy, icons, eyebrow text |
| `sand`  | `#f1e9dd` | Warm secondary surface, icon backgrounds, QR preview area    |
| white   | `#ffffff` | Cards, panels, QR canvas container                           |

Color guidance:

- Use `paper` as the default background.
- Use `ink` for important text and primary actions.
- Use `muted` for supporting copy, never for essential information on its own.
- Use `coral` as a deliberate cherry-red accent, not as a large page background.
- Pair `coral` with `paper`, `sand`, or `white`; use `ink` when strong contrast is required.
- QR foreground and background colors must remain sufficiently contrasting for scanability.

## Layout and spacing

The layout is spacious and responsive, with a centered content column.

- Main content max width: `1120px`
- Horizontal gutter: `2.5rem` below 640px; `4rem` from 640px upward
- Header height: `80px`
- Large page sections: usually `py-20` to `py-28`
- Hero minimum height: approximately `620px`
- Common content gaps: `gap-5`, `gap-8`, `gap-14`
- Main body line-height: approximately `1.75` for comfortable reading

Responsive behavior:

- Mobile-first layouts stack content vertically.
- Navigation remains compact and keeps ToolBox as the strongest action.
- Cards move from one column to two and then three columns as space allows.
- The QR generator switches from a two-column workspace to a stacked layout below the large breakpoint.

## Shape language

The site uses rounded forms with a friendly, tactile quality:

- Full pill shape for primary navigation/actions and status-like controls
- `rounded-3xl` for cards, panels, hero surfaces, and major tool areas
- `rounded-2xl` for icon blocks, inputs, and QR containers
- `rounded-xl` for compact selects and color controls
- Borders are subtle and use `line`

Avoid sharp rectangular cards unless a future component has a strong functional reason.

## Surfaces and elevation

The visual hierarchy comes from surface changes more than heavy shadows:

- Page: `paper`
- Secondary section: translucent white over `paper`
- Cards and form panels: white with a `line` border
- Accent surface: `sand`
- QR preview stage: translucent `sand`

The shared card shadow is intentionally light:

```css
0 2px 0 rgba(29, 33, 29, 0.02),
0 12px 32px rgba(29, 33, 29, 0.05)
```

Use elevation to support interaction and grouping. Do not make every surface float.

## Components

### Header

- Paper background with slight transparency and backdrop blur
- Bottom divider using `line`
- Wordmark is `Miha.` with a cherry-red full stop
- `About` and `Work` are muted text links
- `ToolBox` is the dark pill-shaped primary navigation action

### Buttons and links

- Primary button: dark ink background, paper text, pill shape
- Secondary action: bordered pill or text link
- Action links use cherry red when they represent an available tool or forward movement
- Icons are from `lucide-react`, generally 15–16px inside controls
- Hover motion is subtle: slight upward translation or icon movement

### Tool cards

- White, bordered, `rounded-3xl` surface
- Minimum height: `16rem`
- Icon block: `3rem` square, sand background, coral icon
- Category appears as a small paper pill
- Available tools expose a coral “Try it” link
- Future tools use muted “Coming soon” text
- Hover: lift by roughly `4px` and increase shadow slightly

### QR generator

The QR page is split into two clear zones:

1. White control panel containing input, size, colors, actions, and privacy note.
2. Sand preview stage containing the generated QR code on a white elevated canvas.

The interface should remain calm even as more controls are added. Group advanced options rather than adding visual noise beside the primary input.

## Interaction and accessibility

Interaction should feel responsive but restrained:

- Use short color/transform transitions.
- Keep focus visible with a 3px cherry-red-tinted outline and 3px offset.
- Every form control needs a visible or accessible label.
- Disabled actions use reduced opacity and a not-allowed cursor.
- Do not rely on color alone to communicate availability or state.
- Keep touch targets comfortably sized, especially on the QR generator.
- Respect reduced-motion preferences if more animation is introduced.

## Imagery and decoration

The current visual language is intentionally lightweight and does not depend on photography. Decoration is made from simple geometry and a code-native animated nebula:

- Hero dot grid: 18px spacing with small muted dots
- Hero block animation: colored blocks first assemble into an abstract structure, then spell `M I H A` one letter at a time in a slow loop
- Block animation pauses in its completed state when `prefers-reduced-motion: reduce` is enabled
- Minimal iconography from Lucide

New imagery should feel tactile, warm, and editorial. Prefer abstract geometry, data-like patterns, and purposeful motion over generic stock imagery, glossy gradients, noisy backgrounds, and ornamental effects that compete with the content.

## Content voice

Copy is concise, direct, and human:

- Prefer plain language over product jargon.
- Explain what a tool does in one sentence.
- Use short, confident headings.
- Keep the tone curious and quietly optimistic.
- ToolBox should sound helpful, not gimmicky.

## Implementation reference

Design tokens and global behavior live in:

- `app/globals.css`
- `components/site-header.tsx`
- `components/site-footer.tsx`
- `components/tool-card.tsx`
- `components/qr-generator.tsx`
- `components/building-blocks.tsx`

When adding a new component, use the existing tokens (`paper`, `ink`, `muted`, `line`, `coral`, `sand`) before introducing a new color or shadow. The `coral` token is retained as a semantic name for the site’s cherry-red accent.
