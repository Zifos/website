import { globalStyle } from "@vanilla-extract/css";
import { vars } from "./theme.css";

globalStyle(":root", {
  colorScheme: "light dark",
  WebkitTextSizeAdjust: "100%",
  textSizeAdjust: "100%",
});

// BaseLayout `scheme` prop: pin light-dark() tokens to one side for the whole page.
globalStyle('[data-scheme="dark"]', { colorScheme: "dark" });
globalStyle('[data-scheme="light"]', { colorScheme: "light" });

globalStyle("*, *::before, *::after", {
  boxSizing: "border-box",
  margin: 0,
});

globalStyle("body", {
  minHeight: "100dvh",
  fontFamily: vars.font.sans,
  lineHeight: 1.5,
  color: vars.color.text,
  backgroundColor: vars.color.background,
  WebkitFontSmoothing: "antialiased",
});

globalStyle("img, picture, video, canvas, svg", {
  display: "block",
  maxWidth: "100%",
});

globalStyle("h1, h2, h3, h4, h5, h6", {
  fontFamily: vars.font.serif,
  textWrap: "balance",
});

globalStyle("code, kbd, pre, samp", {
  fontFamily: vars.font.mono,
});

globalStyle("::selection", {
  color: vars.color.background,
  backgroundColor: vars.color.fire,
});
