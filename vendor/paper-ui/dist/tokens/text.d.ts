export declare const FONT: {
    readonly sans: "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    readonly mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'D2Coding', monospace";
};
export declare const MONO_SIZE_SCALE = "0.95";
export declare const TYPOGRAPHY_PALETTE: {
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
};
export declare const WEIGHT: {
    readonly regular: "400";
    readonly normal: "450";
    readonly medium: "500";
    readonly strong: "650";
    readonly semibold: "600";
    readonly bold: "700";
};
export type WeightKey = keyof typeof WEIGHT;
export declare const TEXT_VARIANTS: readonly ["display", "title", "heading", "subheading", "body", "caption", "label"];
export type TextVariant = (typeof TEXT_VARIANTS)[number];
export declare const TEXT_SPEC: {
    readonly display: {
        readonly size: "32";
        readonly weight: "bold";
        readonly leading: "40";
        readonly tracking: "tight";
    };
    readonly title: {
        readonly size: "24";
        readonly weight: "bold";
        readonly leading: "32";
        readonly tracking: "snug";
    };
    readonly heading: {
        readonly size: "20";
        readonly weight: "semibold";
        readonly leading: "28";
        readonly tracking: "normal";
    };
    readonly subheading: {
        readonly size: "16";
        readonly weight: "semibold";
        readonly leading: "24";
        readonly tracking: "normal";
    };
    readonly body: {
        readonly size: "14";
        readonly weight: "medium";
        readonly leading: "20";
        readonly tracking: "normal";
    };
    readonly caption: {
        readonly size: "13";
        readonly weight: "regular";
        readonly leading: "16";
        readonly tracking: "normal";
    };
    readonly label: {
        readonly size: "12";
        readonly weight: "semibold";
        readonly leading: "16";
        readonly tracking: "wide";
    };
};
export declare const CONTROL_SPEC: {
    readonly button: {
        readonly regular: {
            readonly sm: {
                readonly size: "13";
                readonly weight: "medium";
                readonly leading: "16";
                readonly tracking: "normal";
            };
            readonly md: {
                readonly size: "13";
                readonly weight: "medium";
                readonly leading: "16";
                readonly tracking: "normal";
            };
            readonly lg: {
                readonly size: "14";
                readonly weight: "medium";
                readonly leading: "16";
                readonly tracking: "normal";
            };
        };
        readonly strong: {
            readonly sm: {
                readonly weight: "strong";
                readonly size: "13";
                readonly leading: "16";
                readonly tracking: "normal";
            };
            readonly md: {
                readonly weight: "strong";
                readonly size: "13";
                readonly leading: "16";
                readonly tracking: "normal";
            };
            readonly lg: {
                readonly weight: "strong";
                readonly size: "14";
                readonly leading: "16";
                readonly tracking: "normal";
            };
        };
    };
    readonly field: {
        readonly sm: {
            readonly size: "13";
            readonly weight: "normal";
            readonly leading: "16";
            readonly tracking: "normal";
        };
        readonly md: {
            readonly size: "13";
            readonly weight: "normal";
            readonly leading: "16";
            readonly tracking: "normal";
        };
        readonly lg: {
            readonly size: "14";
            readonly weight: "normal";
            readonly leading: "16";
            readonly tracking: "normal";
        };
    };
    readonly textarea: {
        readonly sm: {
            readonly leading: "20";
            readonly size: "13";
            readonly weight: "normal";
            readonly tracking: "normal";
        };
        readonly md: {
            readonly leading: "20";
            readonly size: "13";
            readonly weight: "normal";
            readonly tracking: "normal";
        };
        readonly lg: {
            readonly leading: "20";
            readonly size: "14";
            readonly weight: "normal";
            readonly tracking: "normal";
        };
    };
    readonly badge: {
        readonly size: "12";
        readonly weight: "medium";
        readonly leading: "16";
        readonly tracking: "normal";
    };
    readonly navigation: {
        readonly regular: {
            readonly size: "14";
            readonly weight: "normal";
            readonly leading: "20";
            readonly tracking: "normal";
        };
        readonly active: {
            readonly size: "14";
            readonly weight: "medium";
            readonly leading: "20";
            readonly tracking: "normal";
        };
        readonly groupLabel: {
            readonly size: "13";
            readonly weight: "semibold";
            readonly leading: "16";
            readonly tracking: "wide";
        };
    };
    readonly tooltip: {
        readonly regular: {
            readonly size: "12";
            readonly weight: "normal";
            readonly leading: "16";
            readonly tracking: "normal";
        };
    };
};
export declare const TEXT_CONTENT: Record<TextVariant, "primary" | "secondary">;
export declare const TEXT_VALUES: {
    readonly text: {
        readonly palette: {
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
        };
    };
};
