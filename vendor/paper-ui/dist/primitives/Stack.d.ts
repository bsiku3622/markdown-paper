import type { ElementType } from "react";
import { type BoxProps } from "./Box";
export type StackProps<As extends ElementType = "div"> = BoxProps<As> & {
    align?: "start" | "center" | "end" | "stretch";
};
export declare const Stack: <As extends ElementType = "div">({ align, className, ...rest }: StackProps<As>) => import("react").JSX.Element;
