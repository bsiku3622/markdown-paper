import { type TextareaHTMLAttributes } from "react";
import type { ControlSize, StatusName, TextVariant } from "../tokens";
export type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> & {
    status?: "default" | StatusName;
    size?: ControlSize;
    fontSize?: TextVariant;
    className?: string;
};
export declare const Textarea: import("react").ForwardRefExoticComponent<Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> & {
    status?: "default" | StatusName;
    size?: ControlSize;
    fontSize?: TextVariant;
    className?: string;
} & import("react").RefAttributes<HTMLTextAreaElement>>;
