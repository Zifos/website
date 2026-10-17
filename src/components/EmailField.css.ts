import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

// A read-only "field": the address, then the actions, inside one thin border. No accent.
export const field = style({
  display: "inline-flex",
  alignItems: "stretch",
  maxWidth: "100%",
  border: `1px solid ${vars.color.border}`,
  borderRadius: "0.375rem",
  fontFamily: vars.font.sans,
  fontSize: "clamp(1rem, 0.95rem + 0.25vw, 1.125rem)",
  color: vars.color.text,
});

export const address = style({
  display: "flex",
  alignItems: "center",
  minWidth: 0,
  paddingInline: "1em",
  paddingBlock: "0.75em",
  overflowWrap: "anywhere",
  // One click selects the whole address, for copying by hand.
  userSelect: "all",
});

export const action = style({
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
  width: "3em",
  padding: 0,
  // Buttons don't inherit font by default; the em-based width and icon size must match the link's.
  font: "inherit",
  border: "none",
  borderInlineStart: `1px solid ${vars.color.border}`,
  background: "none",
  color: vars.color.textSecondary,
  cursor: "pointer",
  transition: "color 0.2s ease, background-color 0.2s ease",
  selectors: {
    "&:hover": { color: vars.color.text, backgroundColor: vars.color.surface },
    "&:focus-visible": { outline: "1px solid currentColor", outlineOffset: "-4px" },
    "&:last-child": { borderStartEndRadius: "inherit", borderEndEndRadius: "inherit" },
  },
});

export const icon = style({
  width: "1.125em",
  height: "1.125em",
});

// Copy button: the check replaces the copy icon for a moment after copying.
export const iconCopied = style([icon, { display: "none" }]);
globalStyle(`[data-copied] > ${icon}`, { display: "none" });
globalStyle(`[data-copied] > ${iconCopied}`, { display: "block" });

export const visuallyHidden = style({
  position: "absolute",
  width: "1px",
  height: "1px",
  overflow: "hidden",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
});
