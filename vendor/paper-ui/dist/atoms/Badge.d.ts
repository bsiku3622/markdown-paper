import { type HTMLAttributes, type ReactNode } from "react";
import { type Accent, type Variant } from "../resolvers";
import type { ControlSize, TextVariant } from "../tokens";
export type BadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, "className"> & {
    accent?: Accent;
    variant?: Variant;
    size?: ControlSize;
    fontSize?: TextVariant;
    dot?: boolean;
    shape?: "rounded" | "pill";
    children?: ReactNode;
    className?: string;
};
export declare const Badge: import("react").ForwardRefExoticComponent<Omit<HTMLAttributes<HTMLSpanElement>, "className"> & {
    accent?: Accent;
    variant?: Variant;
    size?: ControlSize;
    fontSize?: TextVariant;
    dot?: boolean;
    shape?: "rounded" | "pill";
    children?: ReactNode;
    className?: string;
} & import("react").RefAttributes<HTMLSpanElement>>;
