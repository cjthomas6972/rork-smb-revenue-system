/**
 * SKYFORGE design system.
 *
 * One black canvas. Apple grays. A single accent — molten ember — reserved
 * for the primary action and active states. No decoration that does not
 * carry information. Simplicity is the ultimate sophistication.
 */
const Colors = {
  // Surfaces: true black for OLED, graphite for elevation.
  primary: "#000000",
  secondary: "#0C0C0D",
  tertiary: "#1A1A1C",

  // The one accent. If everything is highlighted, nothing is.
  accent: "#FF6B2C",
  accentDark: "#E5511A",
  accentLight: "#FF8A50",

  // Functional colors — Apple system palette.
  warning: "#FFD60A",
  error: "#FF453A",
  success: "#30D158",

  // Type: Apple white on black; grays establish hierarchy, not color.
  text: "#F5F5F7",
  textSecondary: "#A1A1A6",
  textMuted: "#6E6E73",

  border: "#232326",
  borderLight: "#38383C",
  cardBg: "#0C0C0D",
  inputBg: "#1A1A1C",
  overlay: "rgba(0, 0, 0, 0.72)",

  // Accent ramp for the rare filled control.
  gradient: {
    start: "#FF7A3D",
    end: "#F0511A",
  },

  brand: {
    deepBlue: "#2C2C2E",
    electricBlue: "#48484A",
    fireOrange: "#FF6B2C",
    flameRed: "#FF453A",
    cosmic: "#0C0C0D",
    nebula: "#1A1A1C",
  },

  // Graphite metallic — replaces the rainbow. Used on primary surfaces only.
  brandGradient: {
    start: "#3A3A3C",
    middle: "#1C1C1E",
    end: "#0C0C0D",
  },

  light: {
    text: "#F5F5F7",
    background: "#000000",
    tint: "#FF6B2C",
    tabIconDefault: "#6E6E73",
    tabIconSelected: "#FF6B2C",
  },
};

export default Colors;
