import { type PaletteToken } from "./palette";
import type { AccentPalette } from "./palette";
export declare const STATUS: readonly ["info", "success", "warning", "error"];
export type StatusName = (typeof STATUS)[number];
export declare const ACCENTS: readonly ["primary", "info", "success", "warning", "error"];
export type AccentName = (typeof ACCENTS)[number];
export declare const STATUS_PALETTE: Record<StatusName, AccentPalette>;
export type AccentToken = {
    solid: PaletteToken;
    wash: PaletteToken;
    soft: PaletteToken;
    subtle: PaletteToken;
};
export declare const COLOR_VALUES: {
    bg: {
        raised: PaletteToken;
        canvas: PaletteToken;
        sunken: PaletteToken;
    };
    control: {
        track: PaletteToken;
    };
    border: {
        base: PaletteToken;
        strong: PaletteToken;
        hover: PaletteToken;
    };
    ink: {
        primary: PaletteToken;
        secondary: PaletteToken;
        tertiary: PaletteToken;
    };
    accent: Record<"info" | "success" | "warning" | "error" | "primary", AccentToken>;
    interaction: {
        bgHover: {
            onSurface: PaletteToken;
            onPrimarySolid: PaletteToken;
            onAccentSolid: PaletteToken;
        };
        selected: PaletteToken;
        active: PaletteToken;
        focus: PaletteToken;
    };
    overlay: {
        scrim: PaletteToken;
    };
    shadow: {
        overlay: PaletteToken;
        overlayMinimal: PaletteToken;
    };
};
export declare const COLOR_VALUES_DARK: {
    bg: {
        raised: PaletteToken;
        canvas: PaletteToken;
        sunken: PaletteToken;
    };
    control: {
        track: PaletteToken;
    };
    border: {
        base: PaletteToken;
        strong: PaletteToken;
        hover: PaletteToken;
    };
    ink: {
        primary: PaletteToken;
        secondary: PaletteToken;
        tertiary: PaletteToken;
    };
    accent: Record<"info" | "success" | "warning" | "error" | "primary", AccentToken>;
    interaction: {
        bgHover: {
            onSurface: PaletteToken;
            onPrimarySolid: PaletteToken;
            onAccentSolid: PaletteToken;
        };
        selected: PaletteToken;
        active: PaletteToken;
        focus: PaletteToken;
    };
    overlay: {
        scrim: PaletteToken;
    };
    shadow: {
        overlay: PaletteToken;
        overlayMinimal: PaletteToken;
    };
};
