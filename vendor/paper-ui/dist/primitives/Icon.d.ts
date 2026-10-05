import type { ReactNode } from "react";
import { type Ink } from "../resolvers";
export declare const ICON_SIZES: readonly ["label", "caption", "body", "heading3"];
export type IconSize = (typeof ICON_SIZES)[number];
export type IconProps = {
    size?: IconSize;
    ink?: Ink;
    children?: ReactNode;
    className?: string;
    "aria-label"?: string;
};
export declare const Icon: ({ size, ink, children, className, ...rest }: IconProps) => import("react").JSX.Element;
