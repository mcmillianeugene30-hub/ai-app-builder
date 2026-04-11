# Design Brief: AI App Builder

**Tone:** Brutalist-modern, developer-focused, minimal decoration, high information density.

**Fonts:** Bricolage Grotesque (display), General Sans (body), JetBrains Mono (code/UI).

| Palette | OKLCH Light | OKLCH Dark |
| --- | --- | --- |
| Background | 0.99 0 0 | 0.12 0 0 |
| Foreground | 0.1 0 0 | 0.95 0 0 |
| Primary (slate) | 0.35 0.05 250 | 0.72 0.08 250 |
| Accent (cyan) | 0.68 0.16 200 | 0.72 0.18 200 |
| Destructive (red) | 0.57 0.22 25 | 0.62 0.2 25 |
| Muted/Border | 0.92 0 0 / 0.88 0 0 | 0.2 0 0 / 0.25 0 0 |

**Structural Zones:**

| Zone | Treatment |
| --- | --- |
| Header/Navigation | Border-bottom (--border), light card background, subtle elevation |
| Main Content | Clean background, border-driven cards (no shadows) |
| Input Areas | Light input background with border, focus ring in cyan |
| Active States | Cyan accent on buttons, tabs, highlights |
| Footer | Muted background with border-top |

**Component Patterns:**
- Buttons: Primary (slate) for CTAs, secondary (muted) for alternatives, cyan accent on hover/active
- Cards: Border-driven with minimal shadow, rounded-sm (8px)
- Code Blocks: JetBrains Mono, dark background with border
- Tabs: Underline active with cyan accent, no background change
- Form Fields: Border-input with focus ring in cyan

**Spacing & Rhythm:** Base unit = 0.5rem (4px). Compact vertical rhythm for information density.

**Motion:**
- Default transitions: 0.3s cubic-bezier(0.4, 0, 0.2, 1)
- Focus states: 2px cyan ring (--ring)
- Loading: Subtle pulse-accent animation on generation button

**Signature Detail:** Monospace labels for "Prompt", "Code Preview", deployment instructions. Cyan ring pulse during AI generation.

**Constraints:**
- Light theme by default (dark mode via class toggle)
- No gradients, glows, or transparency effects
- Borders > shadows
- High contrast for accessibility (AA+)
- Code snippets in JetBrains Mono with syntax highlighting support
