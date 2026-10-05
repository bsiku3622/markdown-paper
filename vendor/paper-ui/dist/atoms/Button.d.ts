import { type ComponentPropsWithRef, type ElementType, type ReactElement, type ReactNode } from "react";
import { type Accent, type Variant } from "../resolvers";
import type { ControlSize, TextVariant } from "../tokens";
type ButtonOwn<As extends ElementType> = {
    as?: As;
    accent?: Accent;
    variant?: Variant;
    size?: ControlSize;
    fontSize?: TextVariant;
    shape?: "rounded" | "pill";
    loading?: boolean;
    fullWidth?: boolean;
    children?: ReactNode;
    className?: string;
};
export type ButtonProps<As extends ElementType = "button"> = ButtonOwn<As> & Omit<ComponentPropsWithRef<As>, keyof ButtonOwn<As>>;
export declare const Button: <As extends ElementType = "button">(props: ButtonProps<As>) => ReactElement;
export {};
