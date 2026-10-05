import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { type Ink } from "../resolvers";
import type { TextVariant } from "../tokens";
type OwnProps<As extends ElementType> = {
    variant?: TextVariant;
    ink?: Ink;
    family?: "sans" | "mono";
    as?: As;
    children?: ReactNode;
    className?: string;
};
export type TextProps<As extends ElementType = "p"> = OwnProps<As> & Omit<ComponentPropsWithoutRef<As>, keyof OwnProps<As>>;
export declare const Text: <As extends ElementType = "p">({ variant, ink, family, as, children, className, ...rest }: TextProps<As>) => import("react").JSX.Element;
export {};
