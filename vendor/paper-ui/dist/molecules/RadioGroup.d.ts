import { type ReactNode } from "react";
import type { ControlSize } from "../tokens";
export type RadioGroupOrientation = "vertical" | "horizontal";
export type RadioGroupProps = {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    name?: string;
    size?: ControlSize;
    orientation?: RadioGroupOrientation;
    "aria-label"?: string;
    "aria-labelledby"?: string;
    className?: string;
    children: ReactNode;
};
export type RadioGroupItemProps = {
    value: string;
    disabled?: boolean;
    children: ReactNode;
};
export declare const RadioGroupItem: ({ value, disabled, children }: RadioGroupItemProps) => import("react").JSX.Element;
export declare const RadioGroup: (({ value: controlledValue, defaultValue, onValueChange, name, size, orientation, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledby, className, children }: RadioGroupProps) => import("react").JSX.Element) & {
    Item: ({ value, disabled, children }: RadioGroupItemProps) => import("react").JSX.Element;
};
