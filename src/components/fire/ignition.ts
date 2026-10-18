// The title's two lines and the fire's two ignitions, in seconds from page load: shared by the fire
// (components/fire) and the title's entrance (styles/home.css.ts). Each ignition answers a line
// while it's being read, each tuned by eye against its own line.

/** When each title line starts resolving. */
export const TITLE_LINES = [2.0, 3.5] as const;

export const IGNITION = {
  /** The first, failed try (a short bump of warm light and one spark), with the first line. */
  try: 2.45, // on the "po" of "poems", the stressed syllable
  /** The ignition that takes (the fire catches), with the second line. */
  take: 3.65,
};
