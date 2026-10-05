export declare const Z: {
    readonly base: "0";
    readonly raised: "10";
    readonly sticky: "20";
    readonly overlay: "30";
    readonly modal: "40";
    readonly toast: "50";
};
export type ZTier = keyof typeof Z;
export declare const BREAKPOINT: {
    readonly sm: "480px";
    readonly md: "768px";
    readonly lg: "1024px";
    readonly xl: "1280px";
};
export type Breakpoint = keyof typeof BREAKPOINT;
export declare const SIZE_INTENT: {
    readonly full: "100%";
    readonly auto: "auto";
    readonly fit: "fit-content";
    readonly min: "min-content";
    readonly max: "max-content";
    readonly screenW: "100vw";
    readonly screenH: "100vh";
};
export type SizeIntent = keyof typeof SIZE_INTENT;
export declare const POSITIONS: readonly ["relative", "absolute", "fixed", "sticky"];
export type Position = (typeof POSITIONS)[number];
export declare const INSET: {
    readonly "0": "0";
    readonly xs: string;
    readonly sm: string;
    readonly md: string;
    readonly lg: string;
    readonly xl: string;
};
export type InsetSize = keyof typeof INSET;
export declare const LAYOUT_VALUES: {
    readonly z: {
        readonly base: "0";
        readonly raised: "10";
        readonly sticky: "20";
        readonly overlay: "30";
        readonly modal: "40";
        readonly toast: "50";
    };
};
export declare const CONTAINER: {
    readonly content: "72rem";
};
export type ContainerSize = keyof typeof CONTAINER;
export declare const LAYOUT_CONST: {
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
};
