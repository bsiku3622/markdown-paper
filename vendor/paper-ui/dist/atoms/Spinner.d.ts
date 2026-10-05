import type { HTMLAttributes } from "react";
import type { ControlSize } from "../tokens";
export type SpinnerProps = Omit<HTMLAttributes<HTMLSpanElement>, "className" | "children"> & {
    size?: ControlSize;
    label?: string;
    className?: string;
};
export declare const Spinner: ({ size, label, className, ...rest }: SpinnerProps) => import("react").JSX.Element;
