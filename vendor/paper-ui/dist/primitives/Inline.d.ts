import type { ElementType } from "react";
import { type BoxProps } from "./Box";
export type InlineProps<As extends ElementType = "div"> = BoxProps<As> & {
    align?: "start" | "center" | "end" | "baseline";
    justify?: "start" | "center" | "end" | "between";
    wrap?: boolean;
};
export declare const Inline: <As extends ElementType = "div">({ align, justify, wrap, className, ...rest }: InlineProps<As>) => import("react").JSX.Element;
