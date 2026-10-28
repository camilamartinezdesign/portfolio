# Portafolio Camila Martínez

Static one-page portfolio built with Vite (no framework). Content is Spanish.

## Layout

- `index.html` — all page markup. Styling is mostly inline; behaviour hooks are `data-*` attributes.
- `src/main.js` — entry point: imports the stylesheet, the custom elements and `initLanding()`.
- `src/styles/main.css` — global styles, keyframes and responsive rules.
- `src/scripts/landing.js` — page behaviour (scroll progress, reveals, sparkle cursor, project detail overlay…).
- `src/components/` — `<image-slot>` and `<video-slot>` web components used throughout the markup.
- `public/media/`, `public/images/` — project imagery, referenced from the HTML as `./media/...` and `./images/...`.
- `public/CNAME` — custom domain for GitHub Pages.
- `design-source/` — original Codex Design export (runtime, sidecar state, raw uploads). Reference only; not part of the build.

## Commands

- `npm run dev` — dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — serve `dist/`
