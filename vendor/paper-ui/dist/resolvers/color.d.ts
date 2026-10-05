export declare const SURFACES: readonly ["raised", "canvas", "sunken"];
export type Surface = (typeof SURFACES)[number];
export declare const resolveSurface: (surface: Surface | undefined) => string;
export declare const ACCENTS: readonly ["primary", "info", "success", "warning", "error"];
export type Accent = (typeof ACCENTS)[number];
export declare const VARIANTS: readonly ["solid", "soft", "hairline", "ghost", "muted"];
export type Variant = (typeof VARIANTS)[number];
export declare const resolveAccent: (accent: Accent | undefined, variant?: Variant) => string;
export declare const INTERACTIVE = "pui-interactive";
