# Hover and tap interactions

Every hover interaction has a tap equivalent. Nothing depends on hover alone.

## Tooltips (`components/ui/Tooltip.tsx`)

| Input | Behavior |
|---|---|
| Mouse hover | Opens on enter, closes on leave |
| Keyboard focus | Opens on focus, closes on blur. Esc closes it |
| Touch or pen tap | Opens on tap. Closes on an outside tap or Esc |
| Mouse click | Does nothing extra. Hover already opens it |

The trigger is focusable (`tabIndex=0`), and the tooltip is linked with `aria-describedby`.

## Seat details (`components/booking/SeatMap.tsx`)

Seat features appear in a details panel below the map, not in a tooltip on each seat. This avoids nested focus stops on each button. The panel updates on hover, focus, or tap.

## Menus

The phone menu opens on tap of the menu button and closes on Esc or navigation. Navigation state is derived from the path, so no effect is needed.

## Why there is no `useInteractionMode` hook

The plan's step 4.3 proposed a hook. The `Tooltip` decides from `pointerType` on each event instead, which covers hybrid devices correctly. The hook was not needed.
