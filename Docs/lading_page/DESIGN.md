---
name: High-Performance Kinetic System
colors:
  surface: '#121414'
  surface-dim: '#121414'
  surface-bright: '#383939'
  surface-container-lowest: '#0d0e0f'
  surface-container-low: '#1b1c1c'
  surface-container: '#1f2020'
  surface-container-high: '#292a2a'
  surface-container-highest: '#343535'
  on-surface: '#e3e2e2'
  on-surface-variant: '#c4c7c7'
  inverse-surface: '#e3e2e2'
  inverse-on-surface: '#303031'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c9c6c5'
  primary: '#c9c6c5'
  on-primary: '#313030'
  primary-container: '#050505'
  on-primary-container: '#797777'
  inverse-primary: '#5f5e5e'
  secondary: '#ffffff'
  on-secondary: '#283500'
  secondary-container: '#c3f400'
  on-secondary-container: '#556d00'
  tertiary: '#c8c6c5'
  on-tertiary: '#313030'
  tertiary-container: '#050505'
  on-tertiary-container: '#787777'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c9c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#c3f400'
  secondary-fixed-dim: '#abd600'
  on-secondary-fixed: '#161e00'
  on-secondary-fixed-variant: '#3c4d00'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474746'
  background: '#121414'
  on-background: '#e3e2e2'
  surface-variant: '#343535'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 80px
    fontWeight: '900'
    lineHeight: '1.0'
    letterSpacing: -0.04em
  display-md:
    fontFamily: Montserrat
    fontSize: 56px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.1em
  stats-num:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '900'
    lineHeight: '1.0'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
  stack-sm: 12px
  stack-md: 32px
  stack-lg: 80px
---

## Brand & Style

The design system is engineered for a premium, high-octane fitness environment. It targets elite athletes and high-performance individuals who value precision, intensity, and exclusivity. The aesthetic merges **Minimalism** with **Cyber-Athletic** influences, utilizing a dark-mode foundation to allow high-energy accents to "pop" with maximum luminance.

The visual language is defined by:
- **High-Impact Minimalism:** Vast amounts of negative space (obsidian) contrasted against razor-sharp, vibrant focal points.
- **Kinetic Energy:** Use of diagonal lines, italicized weights, and glowing borders to suggest movement and momentum.
- **Glassmorphism:** Subtle translucent layers are used for secondary UI elements to maintain depth without cluttering the "Obsidian" base.
- **Precision:** A meticulous grid-based approach that feels engineered and professional.

## Colors

The palette is dominated by **Obsidian Black (#050505)**, providing a deep, infinite canvas that absorbs light and minimizes distraction. The primary "action" color is **Volt (#CCFF00)**, a high-visibility neon green used exclusively for primary calls to action, progress indicators, and vital status updates.

- **Backgrounds:** Use the Obsidian Black for the base layer. Tertiary Black (#1A1A1A) is reserved for "raised" surfaces like card backgrounds.
- **Accents:** Use Volt for highlights. For hover states or interactive glows, utilize the `accent_glow` with a blur radius of 20px-40px.
- **Gradients:** Use the `gradient_kinetic` for primary buttons and high-impact headers to suggest speed and power.

## Typography

The typography strategy emphasizes **industrial strength and clarity**. 

- **Headlines:** Montserrat is used in heavy weights (800-900) and forced uppercase to mirror the aesthetics of professional sports branding and gym equipment.
- **Body:** Inter provides a clean, neutral balance to the aggressive headlines, ensuring workout descriptions and technical data remain highly legible.
- **Stats:** For numerical data (weights, reps, times), use the `stats-num` style. The italicization adds a sense of forward motion.
- **Letter Spacing:** Headlines should be tightly tracked (`-0.02em` to `-0.04em`) to feel like a solid block of impact, while labels should be widely tracked (`0.1em`) for a premium "technical" feel.

## Layout & Spacing

This design system utilizes a **12-column fixed grid** for desktop, centering the content with generous outer margins (`margin-desktop`) to create a "luxury" feel. 

- **Rhythm:** All spacing is derived from an 8px base unit.
- **Vertical Spacing:** Use `stack-lg` (80px) between major sections to maintain a minimalist, high-end editorial look. 
- **Mobile:** Transition to a 4-column fluid grid with 20px side margins. 
- **Alignment:** Use rigid, left-aligned typography for a structured, architectural feel. Avoid center-alignment for long-form content to maintain the industrial aesthetic.

## Elevation & Depth

In a dark, premium environment, elevation is communicated through **luminance and borders** rather than traditional drop shadows.

- **Layer 0 (Base):** Obsidian Black (#050505).
- **Layer 1 (Cards/Containers):** Tertiary Black (#1A1A1A) with a subtle 1px border (#333333). 
- **Interactive Depth:** Use **Glassmorphism** for overlays (modals or floating navigation). Apply `backdrop-filter: blur(12px)` and a semi-transparent white border (5%) to simulate frosted dark glass.
- **Glow Accents:** Use "Inner Glows" or "Drop Shadows" with the Volt color (#CCFF00) only for active states. These should have a high blur (20px+) and low opacity (20-30%) to suggest a neon light reflecting off a dark surface.

## Shapes

The shape language is **sharp and disciplined**. 

- **Corner Radius:** Standard components use a "Soft" (0.25rem / 4px) radius. This provides just enough refinement to feel modern without losing the aggressive, industrial edge of sharp corners.
- **Interactive Elements:** Buttons and form inputs should strictly adhere to the 4px radius.
- **Large Containers:** Cards or image containers may scale up to `rounded-lg` (8px), but never beyond. Avoid pill-shaped or fully rounded elements to maintain the "High-Performance" brand persona.

## Components

### Buttons
- **Primary:** Background: `gradient_kinetic`. Text: Obsidian Black, Bold, Uppercase. On Hover: Increase brightness and add a 10px Volt outer glow.
- **Secondary:** Background: Transparent. Border: 1px Solid Volt. Text: Volt. On Hover: Background fills with Volt; Text becomes Obsidian.

### Cards
- **Style:** Background: #1A1A1A. Border: 1px Solid #333333. 
- **Hover State:** Border color changes to Volt (#CCFF00). If the card contains an image, apply a slight scale-up (1.05x) to the image within the clipped container.

### Input Fields
- **Style:** Underline only or dark-filled. Use a 1px border on the bottom (#333333).
- **Focus State:** Bottom border turns Volt with a subtle glow. Label text (Inter) shrinks and moves above the field.

### Chips/Tags
- **Style:** Small, uppercase, high letter-spacing. Use a dark gray background with white or Volt text. No borders for "inactive" tags.

### Sports-Style Gradients
- Use the `gradient_fade` (Volt to Transparent) as an overlay on top of athlete photography to create a "Hero" transition effect that blends imagery into the Obsidian background.