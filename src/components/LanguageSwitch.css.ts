import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

// Quiet, typographic: secondary text, the current language in full text color. No accent.
export const nav = style({
  display: "flex",
  alignItems: "center",
  gap: "0.5em",
  fontFamily: vars.font.sans,
  fontSize: "0.8125rem",
  fontWeight: 500,
  letterSpacing: "0.08em",
  color: vars.color.textSecondary,
});

export const link = style({
  // Comfortable tap target without growing the visible label.
  padding: "0.5em 0.25em",
  color: "inherit",
  textDecoration: "none",
  transition: "color 0.2s ease",
  selectors: {
    "&:hover, &[aria-current='page']": { color: vars.color.text },
    "&:focus-visible": { outline: "1px solid currentColor", outlineOffset: "2px" },
    // Middle dot between languages.
    "& + &::before": {
      content: "·",
      marginInlineEnd: "0.75em",
      color: vars.color.textSecondary,
    },
  },
});
