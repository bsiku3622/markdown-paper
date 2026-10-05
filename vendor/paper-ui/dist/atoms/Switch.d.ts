import { type InputHTMLAttributes } from "react";
import type { ControlSize } from "../tokens";
export type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className" | "size"> & {
    size?: ControlSize;
    className?: string;
};
export declare const Switch: import("react").ForwardRefExoticComponent<Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "className" | "type"> & {
    size?: ControlSize;
    className?: string;
} & import("react").RefAttributes<HTMLInputElement>>;
