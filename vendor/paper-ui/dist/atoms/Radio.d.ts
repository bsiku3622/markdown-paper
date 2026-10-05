import { type InputHTMLAttributes } from "react";
import type { ControlSize } from "../tokens";
export type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className" | "size"> & {
    size?: ControlSize;
    className?: string;
};
export declare const Radio: import("react").ForwardRefExoticComponent<Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "className" | "type"> & {
    size?: ControlSize;
    className?: string;
} & import("react").RefAttributes<HTMLInputElement>>;
