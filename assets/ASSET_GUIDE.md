# Catline Defense Asset Guide

This project currently uses CSS/DOM placeholder pixel art. Real image assets can be added later without removing the fallback CSS shapes.

## Recommended formats

- Use PNG for crisp sprites with transparency.
- Use WebP if file size becomes important.
- Keep transparency around units and projectiles.
- Use `image-rendering: pixelated` and `image-rendering: crisp-edges`.

## Suggested pixel-art sizes

- Cat units: 48x48 or 64x64.
- Enemy units: 48x48; boss can be 96x64 or 96x96.
- Projectiles: 16x16 or 24x16.
- UI icons: 16x16 or 24x24.
- Card frames / wave panels: 9-slice friendly sizes such as 96x48.
- Background: 960x400 or 1200x500 for the rooftop battlefield.

## Naming convention

Use lowercase kebab-case names. Keep animation/action names at the end.

### cats/

- `yarn-cat-idle.png`
- `yarn-cat-attack.png`
- `tank-cat-idle.png`
- `sniper-cat-idle.png`
- `fish-cat-idle.png`
- `ninja-cat-idle.png`
- `freezer-cat-idle.png`

### enemies/

- `mouse-walk.png`
- `rat-walk.png`
- `can-rat-walk.png`
- `roomba-walk.png`
- `pigeon-walk.png`
- `laser-drone-walk.png`
- `cucumber-walk.png`
- `spray-bottle-walk.png`
- `hair-dryer-walk.png`
- `robot-mop-walk.png`
- `foil-ball-walk.png`
- `smart-vacuum-boss-walk.png`

### projectiles/

- `yarn-ball.png`
- `sniper-shot.png`
- `freeze-snowball.png`

### ui/

- `fish-icon.png`
- `heart-icon.png`
- `card-frame.png`
- `wave-panel.png`

### backgrounds/

- `rooftop-night.png`

## CSS class mapping

The game already renders stable classes:

### Cats

- `.cat-yarn`
- `.cat-tank`
- `.cat-sniper`
- `.cat-fish`
- `.cat-ninja`
- `.cat-freezer`

### Enemies

- `.enemy-mouse`
- `.enemy-rat`
- `.enemy-can-rat`
- `.enemy-roomba`
- `.enemy-pigeon`
- `.enemy-laser-drone`
- `.enemy-cucumber`
- `.enemy-spray-bottle`
- `.enemy-hair-dryer`
- `.enemy-robot-mop`
- `.enemy-foil-ball`
- `.enemy-smart-vacuum-boss`
- `.enemy-boss` remains as a compatibility alias for the boss fallback CSS.

### Projectiles

- `.projectile-yarn`
- `.projectile-sniper`
- `.projectile-freeze`

## Step-by-step replacement

1. Put the sprite file in the matching `assets/` subfolder.
2. Set `useImageAssets: true` in `CONFIG` inside `script.js`.
3. Add or uncomment the matching `background-image` rule in the `Asset replacement hooks` section of `styles.css`.
4. Keep `background-size: contain`, `background-repeat: no-repeat`, and `background-position: center`.
5. Verify the sprite size in browser and keep `image-rendering: pixelated`.
6. Leave fallback CSS shapes in place so the game still works if an image is missing or the toggle is off.

## Example

```css
.uses-image-asset .cat-yarn .cat-body {
  background-image: url("./assets/cats/yarn-cat-idle.png");
}
```

The fallback body, ears, tail, face, HP bars, and cooldown indicators should stay in CSS until a complete sprite pipeline exists.
