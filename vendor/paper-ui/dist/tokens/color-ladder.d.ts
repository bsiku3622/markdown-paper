type Oklch = readonly [lightness: number, chroma: number, hue: number];
declare const paletteTokenBrand: unique symbol;
export type PaletteToken = string & {
    readonly [paletteTokenBrand]: true;
};
export declare const toPaletteToken: (color: Oklch) => PaletteToken;
export declare const withAlpha: (color: PaletteToken, opacity: number) => PaletteToken;
export declare const interpolateOklch: (from: Oklch, to: Oklch, ratio: number) => Oklch;
export declare const completeOklchRamp: <Step extends string>(steps: readonly Step[], anchors: Partial<Record<Step, Oklch>>) => Record<Step, Oklch>;
export {};
