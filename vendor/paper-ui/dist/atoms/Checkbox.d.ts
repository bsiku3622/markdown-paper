import { type InputHTMLAttributes } from "react";
import type { ControlSize } from "../tokens";
export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className" | "size"> & {
    size?: ControlSize;
    indeterminate?: boolean;
    className?: string;
};
export declare const Checkbox: import("react").ForwardRefExoticComponent<Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "className" | "type"> & {
    size?: ControlSize;
    indeterminate?: boolean;
    className?: string;
} & import("react").RefAttributes<HTMLInputElement>>;
