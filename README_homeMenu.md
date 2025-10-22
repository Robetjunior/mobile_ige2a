# Home Floating Submenu (V2)

This document records decisions and TODOs for the floating submenu added to the Home screen, aligned to the video 1 reference.

## Architecture
- Components: `HomeMenuTrigger` (merged into `SearchBar` right button), `HomeMenuSheet`, `HomeMenuItem`.
- Store: `useHomeMenuStore` (Zustand) with `isOpen`, `anchor`, `lastSelection`, `menuEnabledV2`.
- Navigation: React Navigation native stack + bottom tabs. Menu navigates to: `Me`, `Cards`, `Record`, `Settings`, `Support`, `About`, and `logout`.
- Telemetry & Logs: Uses `LOGGER.UI.info('homeMenu.open')`, `LOGGER.UI.info('homeMenu.close')`, `LOGGER.UI.info('homeMenu.select', { itemId })` via `useHomeMenuStore`.

## UI & Theme Tokens
- Colors: `COLORS.background`, `COLORS.backgroundSecondary`, `COLORS.textPrimary`, `COLORS.textSecondary`, `COLORS.border`, `COLORS.borderLight`.
- Spacing: `SIZES.xs`, `SIZES.sm`, `SIZES.md`, `SIZES.radius`, `SIZES.radiusMD`, `SIZES.radiusLG`.
- Shadows: iOS shadow + Android elevation tuned to resemble video. Sheet elevation `8`, shadowOpacity `0.2`, radius `12`.
- Trigger size: Right button `44x44` with friendly hitSlop.

## Icons (Ionicons)
- `person-outline` → Perfil/Conta
- `card-outline` → Carteira/Meus cartões (badge: count of saved cards)
- `time-outline` → Histórico
- `settings-outline` → Configurações
- `help-circle-outline` → Ajuda/Suporte (chevron)
- `information-circle-outline` → Sobre
- `log-out-outline` → Sair

> TODO: If video 1 shows proprietary icons, swap Ionicons for closest matches above and consider adding a custom icon set import.

## Animations & Haptics
- Open/close: scale + fade + slight translateY with Reanimated timing/easing.
- Item press: subtle scale/alpha micro-interaction + haptics (light impact) when selecting significant actions.
- Backdrop: fade in/out. Swipe down to dismiss.

## Accessibility
- Roles: `accessibilityRole="menu"` for sheet and `accessibilityRole="menuitem"` for items.
- Screen reader labels reflect item names.
- Web: keyboard focus via tab order on items.

## Feature Flag & Rollout
- `menuEnabledV2` in `useHomeMenuStore` toggles V2 menu.
- When disabled, SearchBar right button falls back to the previous recent drawer behavior.

## Manual Test Checklist (QA)
- Trigger area ≥ `44x44` and opens menu at the button anchor.
- Backdrop click closes menu; Android back button closes; switching tabs closes.
- Animations match visually (duration/easing) to video 1; items stagger if present.
- Items order, labels, chevrons, dividers, and badges (cards count) match video 1.
- Accessibility: menu and items announced correctly; tab/keyboard focus works on web.
- Performance: Open/close runs at 60fps on mid-range devices.
- Responsiveness: iPhone SE/12/13/14, Android 6.1"/6.7", Web 360–1280 widths.
- No regressions on the Home screen: map, cards, and original buttons still functional.

## Known Limitations / TODOs
- Backdrop blur: if video 1 uses blur, integrate with `expo-blur` or custom blur view (kept out to avoid new deps).
- Proprietary icons: replace Ionicons with custom set if needed.
- ErrorBoundary: consider a local boundary around `HomeMenuSheet` if it evolves.