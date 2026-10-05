import { type ReactNode } from "react";
import { type BoxProps } from "../primitives";
import type { ControlSize } from "../tokens";
export type SegmentedControlProps = Omit<BoxProps<"div">, "as" | "children"> & {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    size?: ControlSize;
    shape?: "rounded" | "pill";
    children: ReactNode;
};
export type SegmentedControlItemProps = Omit<BoxProps<"button">, "as" | "value"> & {
    value: string;
};
export declare const SegmentedControlItem: ({ value, className, onClick, ...rest }: SegmentedControlItemProps) => import("react").JSX.Element;
export declare const SegmentedControl: (({ value: controlledValue, defaultValue, onValueChange, size, shape, className, children, onKeyDown, ...rest }: SegmentedControlProps) => import("react").JSX.Element) & {
    Item: ({ value, className, onClick, ...rest }: SegmentedControlItemProps) => import("react").JSX.Element;
};
