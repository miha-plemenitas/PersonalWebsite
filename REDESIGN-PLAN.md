# Portfolio redesign

The portfolio at `/` is a single-page Next.js site with an original animated pixel mountain range. The visual reference is [boat.dev](https://boat.dev/). Use its technical, graphic-led pacing as inspiration for the portfolio’s own content and visual identity.

## Design

- Build around black, white, and `#1d2f80`, with pale indigo and limited complementary highlights for depth.
- Keep the introduction and primary actions as readable HTML in the hero. Use a low-resolution Canvas 2D scene and Motion for the decorative landscape. Give reduced-motion visitors a still scene.
- Use square shadcn Button and Navigation Menu controls with consistent spacing and visible keyboard focus. Navigation targets the existing sections and reflects the section in view.
- Preserve Work, About, Résumé, Toolbox, and Contact, including existing project anchors, project links, and direct utility URLs.

## Ownership and verification

- Portfolio frontend owns the homepage composition, content, and section styles.
- Pixel art and motion owns the hero scene, pointer response, and rendering fallbacks.
- Navigation and design system owns the portfolio header, its styles, and the design reference.
- The coordinator owns dependencies, integration, and verification. Check desktop and mobile, anchor clearance, keyboard and touch navigation, reduced motion, renderer failure, legacy redirects, and Stamp route isolation. Run lint, typecheck, and a production build.
