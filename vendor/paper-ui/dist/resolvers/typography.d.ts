import type { ControlSize } from "../tokens";
export declare function resolveControlTypography(role: "button", size: ControlSize, emphasis: "regular" | "strong"): string;
export declare function resolveControlTypography(role: "field" | "textarea", size: ControlSize): string;
export declare function resolveControlTypography(role: "badge"): string;
export declare function resolveControlTypography(role: "navigation", state: "regular" | "active"): string;
export declare function resolveControlTypography(role: "navigation", state: "groupLabel"): string;
export declare function resolveControlTypography(role: "tooltip", state: "regular"): string;
