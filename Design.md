---
name: SNS Newsletter Generator
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1b1b1d'
  surface-container: '#1f1f21'
  surface-container-high: '#2a2a2b'
  surface-container-highest: '#353436'
  on-surface: '#e4e2e4'
  on-surface-variant: '#c6c6cd'
  inverse-surface: '#e4e2e4'
  inverse-on-surface: '#303032'
  outline: '#909097'
  outline-variant: '#45464d'
  surface-tint: '#bec6e0'
  primary: '#bec6e0'
  on-primary: '#283044'
  primary-container: '#0f172a'
  on-primary-container: '#798098'
  inverse-primary: '#565e74'
  secondary: '#adc6ff'
  on-secondary: '#002e6a'
  secondary-container: '#0566d9'
  on-secondary-container: '#e6ecff'
  tertiary: '#b7c8e1'
  on-tertiary: '#213145'
  tertiary-container: '#06182b'
  on-tertiary-container: '#728299'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#131315'
  on-background: '#e4e2e4'
  surface-variant: '#353436'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The design system is engineered for a high-performance AI SaaS platform that bridges the gap between structured editorial content and dynamic social media aesthetics. The brand personality is **Modern, High-tech, and Trustworthy**, characterized by a deep, stable foundation punctuated by bursts of **Creative Energy**.

The visual style employs a **Corporate-Modern** framework infused with **Glassmorphism** and **High-Contrast** accents. This approach ensures the tool feels like a professional enterprise utility while signaling the cutting-edge nature of AI-driven creativity. The UI should evoke a sense of "intelligent automation"—efficient, precise, yet vibrant.

## Colors

The palette is optimized for a dark-mode-first experience to reduce eye strain during content creation and to highlight the "Electric Blue" AI accents.

- **Primary (Deep Navy):** Used for the main background and deep structural elements. It provides the "Trustworthy" anchor.
- **Secondary (Electric Blue):** Used for primary actions, active states, and AI-driven indicators.
- **Tertiary (Soft Slate):** Reserved for secondary text, borders, and inactive icons to maintain a clear hierarchy.
- **CTA Gradient:** A vibrant mix of Electric Blue and Vivid Violet to draw attention to conversion points and creative generation triggers.
- **Semantic Colors:** Success (Emerald-400), Warning (Amber-400), and Error (Rose-500) are used sparingly against the navy background for high legibility.

## Typography

This design system utilizes **Inter** exclusively to leverage its exceptional legibility and neutral, systematic tone. 

- **Headlines:** Use Bold (700) or ExtraBold (800) weights with slightly tight letter spacing to create a high-impact, editorial feel.
- **Body:** Stick to Regular (400) weight for maximum readability against dark backgrounds.
- **Labels:** Use Medium (500) or SemiBold (600) for UI elements like chips, buttons, and navigation to ensure they stand out as interactive components.
- **Responsive Strategy:** Display and Headline-LG styles must scale down on mobile to prevent awkward line breaks in the newsletter editor.

## Layout & Spacing

The system follows a strict **8px square grid** to ensure mathematical harmony across all components.

- **Layout Model:** A **Fluid Grid** is used for the main dashboard, allowing the newsletter workspace to expand. The marketing site uses a **Fixed Grid** (max-width 1280px) to maintain editorial control.
- **Breakpoints:**
  - **Mobile:** < 640px (1-column stack, 16px margins).
  - **Tablet:** 640px - 1024px (2-column layout, 24px margins).
  - **Desktop:** > 1024px (12-column grid, 24px gutters).
- **Whitespace:** Emphasize generous padding (MD to LG) between logical sections to maintain the "Premium" feel and prevent the AI configuration panels from feeling cluttered.

## Elevation & Depth

Hierarchy is established through **Glassmorphism** and **Tonal Layering** rather than traditional heavy shadows.

- **Surface Levels:** 
  - **Level 0 (Background):** Deep Navy (#0F172A).
  - **Level 1 (Panels):** Slightly lighter navy or 3% white overlay with a 12px backdrop blur.
  - **Level 2 (Cards/Modals):** Glassmorphic surfaces using `rgba(255, 255, 255, 0.05)` with a 1px border of `rgba(255, 255, 255, 0.1)` to define edges.
- **Shadows:** Use ultra-soft, large-radius shadows (20-40px blur) with 40% opacity of the background color to create a "floating" effect for active cards.

## Shapes

The shape language is approachable yet structured, using **Rounded (0.5rem / 8px)** as the base unit.

- **Base Components:** Buttons and Input fields use the standard 8px radius.
- **Large Components:** Cards, modals, and preview containers (Rounded-LG/XL) use **12px to 16px** radius to emphasize the friendly, creative energy of the product.
- **Selection Elements:** Chips and AI-toggle switches use a **Pill** shape (999px) to distinguish them from structural layout elements.

## Components

- **Buttons:** 
  - **Primary:** Features the CTA Gradient with white text.
  - **Secondary:** Transparent with a Soft Slate border or 10% white fill.
- **Cards:** Utilize the glassmorphism effect—semi-transparent background, 16px corner radius, and a subtle white inner-stroke (1px) to catch the light.
- **Input Fields:** Deep Navy fill with a Soft Slate border. On focus, the border transitions to Electric Blue with a soft outer glow.
- **Selection Chips:** Used for social media platform selection (e.g., Instagram, LinkedIn). Active state uses Electric Blue fill; inactive uses a ghost-style Soft Slate outline.
- **AI Progress Indicators:** Use thin, pulsating Electric Blue lines or glowing "aurora" blurs to indicate generative processes.
- **Lists:** Clean rows separated by 1px Soft Slate lines at 10% opacity, featuring generous vertical padding for touch-friendly interaction on mobile.
