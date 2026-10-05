import type { PaletteToken } from "./color-ladder";
export type { PaletteToken } from "./color-ladder";
export type ColorMode = "light" | "dark";
export declare const PALETTE_STEPS: readonly ["0", "50", "100", "150", "200", "300", "400", "500", "600", "700", "800", "900", "925", "950"];
export type PaletteStep = (typeof PALETTE_STEPS)[number];
export declare const ACCENT_STEPS: readonly ["50", "100", "150", "200", "300", "400", "500", "600", "700", "800", "900", "925", "950"];
export type AccentStep = (typeof ACCENT_STEPS)[number];
export declare const ALPHA_STEPS: readonly ["05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55", "60", "65", "70", "75", "80", "85", "90", "95"];
export type AlphaStep = (typeof ALPHA_STEPS)[number];
export declare const ALPHA_OPACITY: Record<AlphaStep, number>;
export type Oklch = readonly [lightness: number, chroma: number, hue: number];
export declare const NEUTRAL_BASE_STEPS: readonly ["0", "50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
export type NeutralBaseStep = (typeof NEUTRAL_BASE_STEPS)[number];
export declare const NEUTRAL_ANCHORS: Partial<Record<NeutralBaseStep, Oklch>>;
export declare const ACCENT_PALETTES: readonly ["blue", "green", "amber", "red"];
export type AccentPalette = (typeof ACCENT_PALETTES)[number];
export declare const OKLCH_PALETTE: {
    neutral: Record<"0" | "50" | "100" | "150" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900" | "925" | "950", Oklch>;
    accent: Record<"blue" | "green" | "amber" | "red", Record<"50" | "100" | "150" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900" | "925" | "950", Oklch>>;
};
type NeutralPalette = Record<PaletteStep, PaletteToken>;
type AccentRamp = Record<AccentStep, PaletteToken>;
export declare const PALETTE_TOKENS: {
    alpha50: {
        neutral: {
            "0": PaletteToken;
            "950": PaletteToken;
        };
    };
    alpha05: {
        neutral: {
            "0": PaletteToken;
            "950": PaletteToken;
        };
    };
    alpha10: {
        neutral: {
            "0": PaletteToken;
            "950": PaletteToken;
        };
    };
    alpha15: {
        neutral: {
            "0": PaletteToken;
            "950": PaletteToken;
        };
    };
    alpha20: {
        neutral: {
            "0": PaletteToken;
            "950": PaletteToken;
        };
    };
    alpha25: {
        neutral: {
            "0": PaletteToken;
            "950": PaletteToken;
        };
    };
    alpha30: {
        neutral: {
            "0": PaletteToken;
            "950": PaletteToken;
        };
    };
    alpha35: {
        neutral: {
            "0": PaletteToken;
            "950": PaletteToken;
        };
    };
    alpha40: {
        neutral: {
            "0": PaletteToken;
            "950": PaletteToken;
        };
    };
    alpha45: {
        neutral: {
            "0": PaletteToken;
            "950": PaletteToken;
        };
    };
    alpha55: {
        neutral: {
            "0": PaletteToken;
            "950": PaletteToken;
        };
    };
    alpha60: {
        neutral: {
            "0": PaletteToken;
            "950": PaletteToken;
        };
    };
    alpha65: {
        neutral: {
            "0": PaletteToken;
            "950": PaletteToken;
        };
    };
    alpha70: {
        neutral: {
            "0": PaletteToken;
            "950": PaletteToken;
        };
    };
    alpha75: {
        neutral: {
            "0": PaletteToken;
            "950": PaletteToken;
        };
    };
    alpha80: {
        neutral: {
            "0": PaletteToken;
            "950": PaletteToken;
        };
    };
    alpha85: {
        neutral: {
            "0": PaletteToken;
            "950": PaletteToken;
        };
    };
    alpha90: {
        neutral: {
            "0": PaletteToken;
            "950": PaletteToken;
        };
    };
    alpha95: {
        neutral: {
            "0": PaletteToken;
            "950": PaletteToken;
        };
    };
    neutral: NeutralPalette;
    accent: Record<"blue" | "green" | "amber" | "red", AccentRamp>;
};
