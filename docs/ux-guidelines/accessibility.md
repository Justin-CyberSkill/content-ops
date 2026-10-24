# Accessibility

Read before you finish any UI change.

## From the sources

- Build accessibility in from the start. It costs about the same as building inaccessibly, and fixing it later costs more. `[Myth: accessibility is expensive]`
- Accessible doesn't mean plain. Keep content and structure separate from styling so people can adapt it. `[Myth: accessible sites are ugly]`
- Don't carry meaning by colour alone, and be careful with motion, which affects people with motion sensitivity. `[Von Restorff]`
- Plan for a wide range of abilities, devices and ways of input. `[Postel]`

## Standard to check against

The three sources give no thresholds, so check against WCAG 2.2 AA:
- Contrast: 4.5:1 for text; 3:1 for large text, icons, focus rings and the edges people need to see a control.
- Targets: at least 24 × 24 CSS px, or enough space around smaller ones.
- Keyboard: everything works with the keyboard, focus is always visible, and sticky bars never hide it.
- Names: every control has an accessible name, and every field a visible label.
- Errors: identified and described in text.
- Zoom: content works at 200% zoom and at 320 px wide without sideways scroll.
