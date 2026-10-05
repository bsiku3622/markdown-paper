export declare const textTypography: Record<"display" | "title" | "heading" | "subheading" | "body" | "caption" | "label", string>;
export declare const controlTypography: {
    readonly button: {
        readonly regular: Record<"sm" | "md" | "lg", string>;
        readonly strong: Record<"sm" | "md" | "lg", string>;
    };
    readonly field: Record<"sm" | "md" | "lg", string>;
    readonly textarea: Record<"sm" | "md" | "lg", string>;
    readonly badge: string;
    readonly navigation: {
        readonly regular: string;
        readonly active: string;
        readonly groupLabel: string;
    };
    readonly tooltip: {
        readonly regular: string;
    };
};
