type StyleKeys = {
    size: string;
    weight: string;
    leading: string;
    tracking: string;
};
export declare const tokens: {
    readonly color: import("./helpers").VarTree<{
        bg: {
            raised: import("./color-ladder").PaletteToken;
            canvas: import("./color-ladder").PaletteToken;
            sunken: import("./color-ladder").PaletteToken;
        };
        control: {
            track: import("./color-ladder").PaletteToken;
        };
        border: {
            base: import("./color-ladder").PaletteToken;
            strong: import("./color-ladder").PaletteToken;
            hover: import("./color-ladder").PaletteToken;
        };
        ink: {
            primary: import("./color-ladder").PaletteToken;
            secondary: import("./color-ladder").PaletteToken;
            tertiary: import("./color-ladder").PaletteToken;
        };
        accent: Record<"info" | "success" | "warning" | "error" | "primary", import("./colors").AccentToken>;
        interaction: {
            bgHover: {
                onSurface: import("./color-ladder").PaletteToken;
                onPrimarySolid: import("./color-ladder").PaletteToken;
                onAccentSolid: import("./color-ladder").PaletteToken;
            };
            selected: import("./color-ladder").PaletteToken;
            active: import("./color-ladder").PaletteToken;
            focus: import("./color-ladder").PaletteToken;
        };
        overlay: {
            scrim: import("./color-ladder").PaletteToken;
        };
        shadow: {
            overlay: import("./color-ladder").PaletteToken;
            overlayMinimal: import("./color-ladder").PaletteToken;
        };
    }>;
    readonly shape: {
        readonly shadow: {
            [k: string]: string;
        };
        readonly height: import("./helpers").VarTree<{
            readonly xs: {
                readonly interaction: string;
                readonly layout: string;
            };
            readonly sm: {
                readonly interaction: string;
                readonly layout: string;
            };
            readonly md: {
                readonly interaction: string;
                readonly layout: string;
            };
            readonly lg: {
                readonly interaction: string;
                readonly layout: string;
            };
            readonly xl: {
                readonly interaction: string;
                readonly layout: string;
            };
        }>;
        readonly width: import("./helpers").VarTree<{
            readonly xs: {
                readonly layout: string;
            };
            readonly sm: {
                readonly layout: string;
            };
            readonly md: {
                readonly layout: string;
            };
            readonly lg: {
                readonly layout: string;
            };
            readonly xl: {
                readonly layout: string;
            };
        }>;
        readonly padding: import("./helpers").VarTree<{
            readonly xs: {
                readonly interaction: string;
                readonly layout: string;
            };
            readonly sm: {
                readonly interaction: string;
                readonly layout: string;
            };
            readonly md: {
                readonly interaction: string;
                readonly layout: string;
            };
            readonly lg: {
                readonly interaction: string;
                readonly layout: string;
            };
            readonly xl: {
                readonly interaction: string;
                readonly layout: string;
            };
        }>;
        readonly gap: import("./helpers").VarTree<{
            readonly xs: string;
            readonly sm: string;
            readonly md: string;
            readonly lg: string;
            readonly xl: string;
        }>;
        readonly radius: import("./helpers").VarTree<{
            readonly interaction: string;
            readonly layout: {
                readonly sm: string;
                readonly md: string;
                readonly lg: string;
            };
            readonly full: "999px";
        }>;
        readonly controlPaddingX: import("./helpers").VarTree<{
            readonly sm: string;
            readonly md: string;
            readonly lg: string;
        }>;
        readonly inputPaddingX: import("./helpers").VarTree<{
            readonly sm: string;
            readonly md: string;
            readonly lg: string;
        }>;
        readonly textareaPaddingY: import("./helpers").VarTree<{
            readonly sm: string;
            readonly md: string;
            readonly lg: string;
        }>;
        readonly icon: import("./helpers").VarTree<{
            readonly sm: string;
            readonly md: string;
            readonly lg: string;
        }>;
        readonly iconTextSize: import("./helpers").VarTree<{
            readonly label: string;
            readonly caption: string;
            readonly body: string;
            readonly heading3: string;
        }>;
        readonly badge: import("./helpers").VarTree<{
            readonly sm: string;
            readonly md: string;
            readonly lg: string;
        }>;
        readonly badgePaddingX: import("./helpers").VarTree<{
            readonly sm: string;
            readonly md: string;
            readonly lg: string;
        }>;
        readonly checkbox: import("./helpers").VarTree<{
            readonly sm: {
                readonly box: string;
                readonly mark: string;
                readonly short: string;
                readonly radius: string;
            };
            readonly md: {
                readonly box: string;
                readonly mark: string;
                readonly short: string;
                readonly radius: string;
            };
            readonly lg: {
                readonly box: string;
                readonly mark: string;
                readonly short: string;
                readonly radius: string;
            };
        }>;
        readonly switch: import("./helpers").VarTree<{
            readonly sm: {
                readonly w: string;
                readonly h: string;
                readonly thumb: string;
            };
            readonly md: {
                readonly w: string;
                readonly h: string;
                readonly thumb: string;
            };
            readonly lg: {
                readonly w: string;
                readonly h: string;
                readonly thumb: string;
            };
        }>;
        readonly measure: import("./helpers").VarTree<{
            readonly xs: "28rem";
            readonly sm: "32rem";
            readonly md: "38rem";
            readonly lg: "42rem";
            readonly xl: "46rem";
        }>;
        readonly constants: import("./helpers").VarTree<{
            readonly borderWidth: "1px";
            readonly focusRingWidth: "2px";
            readonly focusRingOffset: "2px";
            readonly activeIndicatorWidth: "2px";
            readonly checkMarkStrokeWidth: "2px";
            readonly spinnerStrokeWidth: "2px";
            readonly iconStrokeWidth: "1.75";
        }>;
        readonly atom: import("./helpers").VarTree<{
            readonly selectArrow: string;
        }>;
        readonly component: import("./helpers").VarTree<{
            readonly navbarHeight: string;
            readonly segmentedTrackGap: "1px";
            readonly segmentedTrackPad: "3px";
            readonly modalWidth: {
                readonly sm: string;
                readonly md: string;
                readonly lg: string;
            };
            readonly pageHeaderContentWidth: string;
            readonly tableRowHeight: {
                readonly compact: string;
                readonly default: string;
                readonly comfortable: string;
            };
        }>;
    };
    readonly layout: {
        readonly breakpoint: {
            readonly sm: "480px";
            readonly md: "768px";
            readonly lg: "1024px";
            readonly xl: "1280px";
        };
        readonly sizeIntent: {
            readonly full: "100%";
            readonly auto: "auto";
            readonly fit: "fit-content";
            readonly min: "min-content";
            readonly max: "max-content";
            readonly screenW: "100vw";
            readonly screenH: "100vh";
        };
        readonly position: readonly ["relative", "absolute", "fixed", "sticky"];
        readonly inset: {
            readonly "0": "0";
            readonly xs: string;
            readonly sm: string;
            readonly md: string;
            readonly lg: string;
            readonly xl: string;
        };
        readonly container: {
            readonly content: "72rem";
        };
        readonly z: import("./helpers").VarTree<{
            readonly base: "0";
            readonly raised: "10";
            readonly sticky: "20";
            readonly overlay: "30";
            readonly modal: "40";
            readonly toast: "50";
        }>;
    };
    readonly motion: {
        readonly duration: {
            readonly instant: "0ms";
            readonly reduced: "0.01ms";
            readonly fast: "100ms";
            readonly base: "130ms";
            readonly moderate: "200ms";
            readonly slow: "300ms";
        };
        readonly easing: {
            readonly linear: "linear";
            readonly standard: "cubic-bezier(0.4, 0, 0.2, 1)";
            readonly decelerate: "cubic-bezier(0, 0, 0.2, 1)";
            readonly accelerate: "cubic-bezier(0.4, 0, 1, 1)";
            readonly overshoot: "cubic-bezier(0.22, 1, 0.36, 1)";
        };
        readonly loop: {
            readonly spin: "900ms";
            readonly pulse: "1400ms";
        };
        readonly role: {
            readonly hover: {
                readonly duration: "100ms";
                readonly easing: "cubic-bezier(0.4, 0, 0.2, 1)";
            };
            readonly focus: {
                readonly duration: "100ms";
                readonly easing: "cubic-bezier(0.4, 0, 0.2, 1)";
            };
            readonly state: {
                readonly duration: "130ms";
                readonly easing: "cubic-bezier(0.4, 0, 0.2, 1)";
            };
            readonly enter: {
                readonly duration: "200ms";
                readonly easing: "cubic-bezier(0.22, 1, 0.36, 1)";
                readonly offset: "6px";
                readonly scale: "0.99";
            };
            readonly exit: {
                readonly duration: "100ms";
                readonly easing: "cubic-bezier(0.4, 0, 1, 1)";
            };
        };
    };
    readonly text: {
        readonly style: {
            readonly display: StyleKeys;
            readonly title: StyleKeys;
            readonly heading: StyleKeys;
            readonly subheading: StyleKeys;
            readonly body: StyleKeys;
            readonly caption: StyleKeys;
            readonly label: StyleKeys;
        };
        readonly control: {
            readonly button: {
                readonly regular: {
                    readonly sm: StyleKeys;
                    readonly md: StyleKeys;
                    readonly lg: StyleKeys;
                };
                readonly strong: {
                    readonly sm: StyleKeys;
                    readonly md: StyleKeys;
                    readonly lg: StyleKeys;
                };
            };
            readonly field: {
                readonly sm: StyleKeys;
                readonly md: StyleKeys;
                readonly lg: StyleKeys;
            };
            readonly textarea: {
                readonly sm: StyleKeys;
                readonly md: StyleKeys;
                readonly lg: StyleKeys;
            };
            readonly badge: StyleKeys;
            readonly navigation: {
                readonly regular: StyleKeys;
                readonly active: StyleKeys;
                readonly groupLabel: StyleKeys;
            };
            readonly tooltip: {
                readonly regular: StyleKeys;
            };
        };
        readonly palette: import("./helpers").VarTree<{
            readonly family: {
                readonly sans: "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
                readonly mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'D2Coding', monospace";
            };
            readonly fontSize: {
                readonly "12": string;
                readonly "13": string;
                readonly "14": string;
                readonly "16": string;
                readonly "20": string;
                readonly "24": string;
                readonly "32": string;
            };
            readonly weight: {
                readonly regular: "400";
                readonly normal: "450";
                readonly medium: "500";
                readonly strong: "650";
                readonly semibold: "600";
                readonly bold: "700";
            };
            readonly leading: {
                readonly "16": string;
                readonly "20": string;
                readonly "24": string;
                readonly "28": string;
                readonly "32": string;
                readonly "40": string;
            };
            readonly tracking: {
                readonly mono: "-0.04em";
                readonly tight: "-0.02em";
                readonly snug: "-0.01em";
                readonly normal: "0";
                readonly wide: "0.01em";
            };
            readonly monoSizeScale: "0.95";
        }>;
    };
};
export { COLOR_VALUES, ACCENTS, STATUS, STATUS_PALETTE } from "./colors";
export type { AccentName, AccentToken, StatusName } from "./colors";
export { SHAPE_VALUES, SHADOW_GEOMETRY, SHAPE_SIZES, SPACE_KEYS, CONTROL_SIZES, SHAPE_ICON_TEXT_SIZE } from "./shape";
export type { ShapeSize, Space, ControlSize } from "./shape";
export { TEXT_VALUES, TEXT_VARIANTS, TEXT_SPEC, CONTROL_SPEC, TEXT_CONTENT, TYPOGRAPHY_PALETTE, WEIGHT } from "./text";
export type { TextVariant, WeightKey } from "./text";
export { MOTION_VALUES, DURATION, EASING, MOTION, stateTransition } from "./motion";
export type { MotionDuration, MotionEasing, MotionRole } from "./motion";
export { LAYOUT_VALUES, LAYOUT_CONST, Z, BREAKPOINT, SIZE_INTENT, POSITIONS, INSET } from "./layout";
export type { ZTier, Breakpoint, SizeIntent, Position, InsetSize } from "./layout";
export { kebab, pathToCssVar, pathToVarRef, walkValues, buildVarTree } from "./helpers";
