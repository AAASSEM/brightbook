---
name: Lumina Learning
colors:
  surface: '#f5fced'
  surface-dim: '#d5dcce'
  surface-bright: '#f5fced'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff6e7'
  surface-container: '#e9f0e1'
  surface-container-high: '#e3ebdc'
  surface-container-highest: '#dee5d6'
  on-surface: '#171d14'
  on-surface-variant: '#3f4a3c'
  inverse-surface: '#2c3228'
  inverse-on-surface: '#ecf3e4'
  outline: '#6f7a6b'
  outline-variant: '#becab9'
  surface-tint: '#006e1c'
  primary: '#006e1c'
  on-primary: '#ffffff'
  primary-container: '#4caf50'
  on-primary-container: '#003c0b'
  inverse-primary: '#78dc77'
  secondary: '#785900'
  on-secondary: '#ffffff'
  secondary-container: '#fdc003'
  on-secondary-container: '#6c5000'
  tertiary: '#0061a4'
  on-tertiary: '#ffffff'
  tertiary-container: '#33a0fe'
  on-tertiary-container: '#00355d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#94f990'
  primary-fixed-dim: '#78dc77'
  on-primary-fixed: '#002204'
  on-primary-fixed-variant: '#005313'
  secondary-fixed: '#ffdf9e'
  secondary-fixed-dim: '#fabd00'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5b4300'
  tertiary-fixed: '#d1e4ff'
  tertiary-fixed-dim: '#9ecaff'
  on-tertiary-fixed: '#001d36'
  on-tertiary-fixed-variant: '#00497d'
  background: '#f5fced'
  on-background: '#171d14'
  surface-variant: '#dee5d6'
typography:
  kid-headline-lg:
    fontFamily: Lexend
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  kid-body-md:
    fontFamily: Lexend
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.5'
  parent-headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  parent-body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  admin-label-xs:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  touch-target-min: 48px
  kid-margin: 24px
  parent-margin: 16px
  gutter: 16px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 40px
---

## Brand & Style

This design system is built on the pillars of **Warmth, Growth, and Encouragement**. It bridges the gap between a playful, imaginative world for children and a reliable, data-driven platform for parents and educators. The visual style is **Tactile-Modern**: it utilizes soft, "squishy" physics and generous radii to make the interface feel approachable and safe for young hands, while maintaining a crisp, card-based structural integrity for administrative tasks.

The emotional response should be one of "joyful accomplishment." For children, the UI acts as a supportive companion; for parents, it provides clarity and confidence in their child's progress. We employ subtle organic shapes and illustrative depth to keep the experience immersive and non-intimidating.

## Colors

The palette is rooted in nature and energy.
- **Primary (Warm Green):** Represents growth and literacy progress. Used for success states, primary actions, and "Go" buttons.
- **Secondary (Amber):** Used exclusively for high-value moments—achievements, stars, and streaks—to trigger a dopamine response.
- **Tertiary (Sky Blue):** A supporting color for informational elements, links, or navigation items to distinguish them from "action" buttons.
- **Neutrals:** We avoid harsh grays. Backgrounds use a very soft off-white with a hint of yellow or green to reduce eye strain and maintain a "paper-like" warmth.

## Typography

This design system utilizes a dual-font strategy to cater to different cognitive needs:
- **For Children:** **Lexend** is the primary choice. Designed specifically to improve reading proficiency, its expanded character spacing and unique letterforms are perfect for literacy. It should be used at larger scales (minimum 18px for body text).
- **For Parents/Admins:** **Plus Jakarta Sans** provides a modern, clean, and friendly aesthetic for reading reports and managing accounts. It offers high legibility for dense data.
- **System Labels:** **Inter** is reserved for small utility labels, tooltips, and data table headers where space is at a premium and a neutral tone is required.

## Layout & Spacing

The layout philosophy follows a **Fluid Content Model** with strict safe-area margins. 
- **Child Interface:** Utilizes a single-column stack on mobile to minimize cognitive load. Spacing is extremely generous (24px+ margins) to prevent accidental taps. Elements are centered vertically to stay within the thumb-zone.
- **Parent/Admin Interface:** Switches to a 12-column grid on desktop and a standard fluid list on mobile. It uses a tighter 8px-based rhythm for data-heavy views.
- **Touch Targets:** All interactive elements in the child view must adhere to a 56px minimum height/width, while the parent view adheres to a standard 44px-48px.

## Elevation & Depth

This design system uses **Tonal Layers and Ambient Shadows** to suggest interactability. 
- **The "Lift" Rule:** Interactive cards for kids should have a soft, colored shadow (tinted with the primary color) that gives them a "squishy" look. Upon hover or tap, the shadow should shrink, and the card should scale down slightly to simulate a physical button press.
- **Parent Section:** Uses flat, low-contrast outlines (1px solid #E0E0E0) for cards to maintain a professional, organized feel, only using shadows to indicate "active" or "floating" states (like modals).
- **Backgrounds:** Child views feature layered, semi-transparent illustrations (blobs, leaves, or clouds) that move slightly on scroll to create a sense of parallax depth.

## Shapes

The shape language is dominated by high-radius curves.
- **Standard Radius:** 16px (0.5rem) for parent-facing cards and inputs.
- **Large Radius (Kid-facing):** 24px (1.5rem) for main buttons and story cards.
- **Pill Shapes:** Used for status badges, chips, and progress bar containers.
- **The "Soft Square":** Avoid sharp 90-degree corners entirely, even in data tables. Every container should feel "hand-held" and friendly.

## Components

- **Buttons:** Kid-facing buttons use a "3D-lite" effect with a thicker bottom border (4px) to look like a physical toy button. Parent buttons are flat with a soft 16px radius.
- **Progress Bars:** Thick, rounded tracks with a glossy "liquid" fill effect. Include a small icon (like a seedling or a book) at the end of the progress line that animates as it moves.
- **Streak Icons:** The "Flame" icon should be housed in an Amber circle with a pulsing animation. The number should use the Lexend font for maximum impact.
- **Achievement Badges:** Circular or hexagonal shapes with a thick white border and a soft drop shadow. Use the Amber palette for "Gold" tier and the Sky Blue for "Starter" tier.
- **Data Tables (Admin):** Minimalist with no vertical lines. Use alternating row highlights in very light green (#F9FBF7) and rounded corners on the top and bottom of the table container.
- **Input Fields:** Large, 18px text, with thick borders (2px) that change color to Warm Green on focus.