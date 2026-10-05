import type { ComponentPropsWithoutRef, CSSProperties, ElementType, ReactNode } from "react";
import { type BoxLike } from "../resolvers";
import { type ShapeSize } from "../tokens";
export type BoxDimension = ShapeSize | "full" | "fit" | "min-content" | "max-content" | number | (string & {});
export type BoxLayoutProps = {
    width?: BoxDimension;
    minWidth?: BoxDimension;
    maxWidth?: BoxDimension;
    height?: BoxDimension;
    minHeight?: BoxDimension;
    maxHeight?: BoxDimension;
    overflow?: CSSProperties["overflow"];
    overflowX?: CSSProperties["overflowX"];
    overflowY?: CSSProperties["overflowY"];
};
type OwnProps<As extends ElementType> = BoxLike & BoxLayoutProps & {
    as?: As;
    border?: boolean;
    radius?: "sm" | "md" | "lg" | "full";
    shadow?: "overlay" | "overlayMinimal";
    inverse?: boolean;
    children?: ReactNode;
    className?: string;
};
export type BoxProps<As extends ElementType = "div"> = OwnProps<As> & Omit<ComponentPropsWithoutRef<As>, keyof OwnProps<As>>;
export declare const Box: <As extends ElementType = "div">({ as, border, radius, shadow, inverse, width, minWidth, maxWidth, height, minHeight, maxHeight, overflow, overflowX, overflowY, children, className, style: styleOverride, ...rest }: BoxProps<As>) => import("react").JSX.Element;
export {};
