# Space Science Club - Brand Design Guidelines

## 1. Brand Identity & Voice
- **Theme**: Deep Space / Futuristic / Academic but Accessible.
- **Visual Style**: High-contrast dark mode with neon accents, glassmorphism, and immersive celestial backgrounds.
- **Voice**: Curious, professional, and inspiring.

## 2. Color Palette
The color system is built on a deep "Space Blue" foundation with vibrant accents and glass-morphic surfaces.

### Background Colors
- **Primary BG**: `#050a18` (Deep Midnight Blue)
- **Secondary BG**: `#0a1128` (Navy Blue)
- **Tertiary BG**: `#0f1a3a` (Deep Indigo)
- **Card/Glass BG**: `rgba(10, 17, 40, 0.7)` with `backdrop-filter: blur(10px)`

### Accent Colors
- **Blue (Primary Accent)**: `#4a9eff` (Star Blue)
- **Cyan**: `#06d6a0` (Emerald Glow - used for success/active states)
- **Purple**: `#7b5ea7` (Nebula Purple)
- **Pink**: `#c77dff` (Supernova Pink)
- **Glow**: `#4a9eff` (Used for radial gradients and shadows)

### Text Colors
- **Primary**: `#ffffff` (Pure White)
- **Secondary**: `rgba(255, 255, 255, 0.7)` (Soft White)
- **Muted**: `rgba(255, 255, 255, 0.45)` (Greyed out/Utility)

## 3. Typography
We use three distinct Google Fonts to create a technical yet modern hierarchy.

- **Display Font (Headings)**: `'Outfit', sans-serif`
  - *Weights*: 800, 900
  - *Usage*: Main section titles, hero headlines.
- **Body Font**: `'Inter', sans-serif`
  - *Weights*: 400, 500
  - *Usage*: Paragraphs, navigation, UI labels.
- **Mono Font (Metadata)**: `'Space Grotesk', sans-serif`
  - *Weights*: 300, 500
  - *Usage*: Section eyebrows, tags, dates, technical meta-info.

### Specific Text Styles
- **Section Eyebrow**: Mono font, uppercase, `0.25em` letter spacing, Primary Blue color.
- **Title Outline**: `-webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.3); color: transparent;`

## 4. Design Elements (UI Kit)
### Gradients
- **Hero Overlay**: `linear-gradient(180deg, transparent 0%, rgba(5, 10, 24, 0.3) 50%, #050a18 100%)`
- **Accent Gradient**: `linear-gradient(135deg, #4a9eff, #7b5ea7)`
- **Text Gradient**: `linear-gradient(135deg, #ffffff 0%, #4a9eff 50%, #c77dff 100%)`

### Border & Radii
- **Standard Radius**: `12px` (Cards), `20px` (Sections/Large Cards).
- **Pill/Full**: `9999px` (Buttons, Tags).
- **Borders**: `1px solid rgba(255, 255, 255, 0.08)` (Subtle glass borders).

### Interactivity & Motion
- **Hover Transitions**: `0.4s cubic-bezier(0.4, 0, 0.2, 1)` (Smooth and weighted).
- **Card Hover Effect**: Translate -6px upwards with a subtle blue outer glow (`rgba(74, 158, 255, 0.1)`).
- **Hero Animation**: Floating effect for main imagery (8s loop, slight rotate/translate).

## 5. Component Logic
- **Cards**: Use glassmorphism (semi-transparent backgrounds + back-drop blur).
- **Buttons (Primary)**: Gradient background, white text, pill-shaped.
- **Buttons (Secondary)**: Transparent background, thin white border, pill-shaped.
- **Sections**: High levels of vertical padding (`120px`) for a spacious, "infinite" feel.
