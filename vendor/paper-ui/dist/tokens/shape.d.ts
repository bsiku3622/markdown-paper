export declare const SHAPE_SIZES: readonly ["xs", "sm", "md", "lg", "xl"];
export type ShapeSize = (typeof SHAPE_SIZES)[number];
export declare const CONTROL_SIZES: readonly ["sm", "md", "lg"];
export type ControlSize = (typeof CONTROL_SIZES)[number];
export declare const SHAPE_HEIGHT: {
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
};
export declare const SHAPE_WIDTH: {
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
};
export declare const SHAPE_PADDING: {
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
};
export declare const SHAPE_GAP: {
    readonly xs: string;
    readonly sm: string;
    readonly md: string;
    readonly lg: string;
    readonly xl: string;
};
export declare const SHAPE_RADIUS: {
    readonly interaction: string;
    readonly layout: {
        readonly sm: string;
        readonly md: string;
        readonly lg: string;
    };
    readonly full: "999px";
};
export declare const CONTROL_PADDING_X: {
    readonly sm: string;
    readonly md: string;
    readonly lg: string;
};
export declare const INPUT_PADDING_X: {
    readonly sm: string;
    readonly md: string;
    readonly lg: string;
};
export declare const TEXTAREA_PADDING_Y: {
    readonly sm: string;
    readonly md: string;
    readonly lg: string;
};
export declare const SHAPE_ICON: {
    readonly sm: string;
    readonly md: string;
    readonly lg: string;
};
export declare const SHAPE_ICON_TEXT_SIZE: {
    readonly label: string;
    readonly caption: string;
    readonly body: string;
    readonly heading3: string;
};
export declare const SHAPE_BADGE: {
    readonly sm: string;
    readonly md: string;
    readonly lg: string;
};
export declare const BADGE_PADDING_X: {
    readonly sm: string;
    readonly md: string;
    readonly lg: string;
};
export declare const SHAPE_CHECKBOX: {
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
};
export declare const SHAPE_SWITCH: {
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
};
export declare const SHAPE_MEASURE: {
    readonly xs: "28rem";
    readonly sm: "32rem";
    readonly md: "38rem";
    readonly lg: "42rem";
    readonly xl: "46rem";
};
export declare const SHADOW_GEOMETRY: {
    readonly light: {
        readonly overlay: readonly ["0 8px 24px 0", "0 2px 6px 0"];
        readonly overlayMinimal: readonly ["0 1px 3px 0"];
    };
    readonly dark: {
        readonly overlay: readonly ["0 8px 22px -5px", "0 3px 7px -2px"];
        readonly overlayMinimal: readonly ["0 1px 2px 0"];
    };
};
export declare const SHAPE_CONSTANTS: {
    readonly borderWidth: "1px";
    readonly focusRingWidth: "2px";
    readonly focusRingOffset: "2px";
    readonly activeIndicatorWidth: "2px";
    readonly checkMarkStrokeWidth: "2px";
    readonly spinnerStrokeWidth: "2px";
    readonly iconStrokeWidth: "1.75";
};
export declare const ATOM_INTRINSIC: {
    readonly selectArrow: string;
};
export declare const COMPONENT_INTRINSIC: {
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
};
export declare const SHAPE_VALUES: {
    readonly height: {
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
    };
    readonly width: {
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
    };
    readonly padding: {
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
    };
    readonly gap: {
        readonly xs: string;
        readonly sm: string;
        readonly md: string;
        readonly lg: string;
        readonly xl: string;
    };
    readonly radius: {
        readonly interaction: string;
        readonly layout: {
            readonly sm: string;
            readonly md: string;
            readonly lg: string;
        };
        readonly full: "999px";
    };
    readonly controlPaddingX: {
        readonly sm: string;
        readonly md: string;
        readonly lg: string;
    };
    readonly inputPaddingX: {
        readonly sm: string;
        readonly md: string;
        readonly lg: string;
    };
    readonly textareaPaddingY: {
        readonly sm: string;
        readonly md: string;
        readonly lg: string;
    };
    readonly icon: {
        readonly sm: string;
        readonly md: string;
        readonly lg: string;
    };
    readonly iconTextSize: {
        readonly label: string;
        readonly caption: string;
        readonly body: string;
        readonly heading3: string;
    };
    readonly badge: {
        readonly sm: string;
        readonly md: string;
        readonly lg: string;
    };
    readonly badgePaddingX: {
        readonly sm: string;
        readonly md: string;
        readonly lg: string;
    };
    readonly checkbox: {
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
    };
    readonly switch: {
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
    };
    readonly measure: {
        readonly xs: "28rem";
        readonly sm: "32rem";
        readonly md: "38rem";
        readonly lg: "42rem";
        readonly xl: "46rem";
    };
    readonly constants: {
        readonly borderWidth: "1px";
        readonly focusRingWidth: "2px";
        readonly focusRingOffset: "2px";
        readonly activeIndicatorWidth: "2px";
        readonly checkMarkStrokeWidth: "2px";
        readonly spinnerStrokeWidth: "2px";
        readonly iconStrokeWidth: "1.75";
    };
    readonly atom: {
        readonly selectArrow: string;
    };
    readonly component: {
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
    };
};
export type Space = ShapeSize;
export declare const SPACE_KEYS: readonly ["xs", "sm", "md", "lg", "xl"];
