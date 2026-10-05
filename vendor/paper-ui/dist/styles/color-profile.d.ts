import { type Accent, type Variant } from "../resolvers/color";
export type ColorSpec = {
    background: string;
    color: string;
    borderColor: string;
    hoverBackground?: string;
    hoverOverlay?: string;
    hoverColor?: string;
};
export declare const accentProfile: (accent: Accent, variant: Variant) => ColorSpec;
