import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  surface: "#FDFBF7",
  onSurface: "#2C2A29",
  surfaceSecondary: "#F4EFE6",
  onSurfaceSecondary: "#4A4745",
  surfaceTertiary: "#E9E3D5",
  onSurfaceTertiary: "#635F5C",
  surfaceInverse: "#1C1B1A",
  onSurfaceInverse: "#FDFBF7",
  muted: "#7A7570",
  brand: "#8C6D48",
  onBrand: "#FFFFFF",
  brandPrimary: "#735332",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#A68661",
  onBrandSecondary: "#2C2A29",
  brandTertiary: "#EFEAE0",
  onBrandTertiary: "#594026",
  success: "#4A6B52",
  onSuccess: "#FFFFFF",
  warning: "#A67C37",
  onWarning: "#FFFFFF",
  error: "#9E473D",
  onError: "#FFFFFF",
  info: "#4A6370",
  onInfo: "#FFFFFF",
  border: "#E2DCCB",
  borderStrong: "#C8BEAB",
  divider: "#EBE5D8",
};

export type ThemeColors = typeof light;
export const defaultScheme = "light" satisfies ColorScheme;
export const themes: { light: ThemeColors; dark?: ThemeColors } = { light };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "light");
}

setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system === "dark" && themes.dark ? "dark" : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}