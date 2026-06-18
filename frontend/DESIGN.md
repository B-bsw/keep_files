---
name: Keep Files
description: A secure, minimal personal file management dashboard.
colors:
  neutral-bg: "#050505"
  neutral-surface: "#111111"
  neutral-border: "#222222"
  neutral-text: "#ffffff"
  neutral-muted: "#a3a3a3"
typography:
  body:
    fontFamily: "Geist Sans, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist Mono, monospace"
    fontSize: "0.875rem"
    letterSpacing: "0.025em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.neutral-text}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
---

# Design System: Keep Files

## 1. Overview

**Creative North Star: "The Digital Vault"**

Keep Files is a secure, dark, indestructible vault for personal files. The interface relies on strict minimalism and a monochromatic black-and-white palette. It explicitly rejects overly complex, cluttered enterprise SaaS layouts and generic, brightly colored templates. Every element is fast and purposeful.

**Key Characteristics:**
- Uncompromising legibility through high contrast.
- Utilitarian, fast, and focused.
- Tonal layering instead of shadows.

## 2. Colors

The palette is strictly monochromatic, relying on pure black, white, and precise grays for hierarchy.

### Neutral
- **Vault Black** (#050505): The absolute background of the application.
- **Surface Dark** (#111111): Used for cards and elevated containers.
- **Border Subtle** (#222222): Dividers and boundaries.
- **Pure White** (#ffffff): Primary text and high-emphasis elements.
- **Muted Gray** (#a3a3a3): Secondary text and less important metadata.

**The Monochromatic Rule.** The interface is strictly black and white. Avoid gradients or vibrant accents; use brightness and contrast to draw attention.

## 3. Typography

**Display Font:** Geist Sans (with Arial fallback)
**Body Font:** Geist Sans (with sans-serif fallback)
**Label/Mono Font:** Geist Mono (with monospace fallback)

**Character:** Technical, crisp, and neutral.

### Hierarchy
- **Display** (700, 2rem, 1.2): Section headers and empty states.
- **Headline** (600, 1.5rem, 1.3): Modal titles and prominent labels.
- **Title** (500, 1.25rem, 1.4): Card headers.
- **Body** (400, 1rem, 1.5): Standard prose and file names.
- **Label** (500, 0.875rem, 0.025em): Small metadata, dates, and sizes.

**The Functional Type Rule.** Typography must guide the eye without confusion. Never use lightweight fonts for body copy.

## 4. Elevation

Tonal Layering. No shadows are used; instead, we use subtle gray backgrounds to show depth.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat. Shadows are explicitly forbidden. Depth is achieved purely by shifting the background color from #050505 to slightly lighter grays.

## 5. Components

### Buttons
- **Shape:** Full pill (9999px) or medium rounded (12px).
- **Primary:** Pure white background (#ffffff), vault black text (#050505). Tactile and confident.
- **Hover / Focus:** Slight opacity shift, no shadow.
- **Secondary:** Dark background with subtle border.

### Cards / Containers
- **Corner Style:** Medium (12px) to Large (16px).
- **Background:** Surface Dark (#111111) or subtle white/5.
- **Shadow Strategy:** Flat. Tonal layering only.
- **Border:** Border Subtle (#222222) or white/10.

### Inputs / Fields
- **Style:** Flat stroke, dark background.
- **Focus:** Crisp white border, no glow.

### Navigation
- **Style:** Sticky top nav, blurred black background, minimal white icons.

## 6. Do's and Don'ts

### Do:
- **Do** use strict black and white for all core UI elements.
- **Do** rely on tonal layering (e.g. from #050505 to #111111) to establish depth.
- **Do** prioritize uncompromising legibility with high contrast.

### Don't:
- **Don't** use gradients, neon colors, or vibrant accents.
- **Don't** use shadows or drop-shadows on components.
- **Don't** create an overly complex or cluttered enterprise SaaS layout.
- **Don't** use gratuitous animations; respect reduced-motion.
