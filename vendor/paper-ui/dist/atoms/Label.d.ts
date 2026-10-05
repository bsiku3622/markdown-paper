import type { LabelHTMLAttributes, ReactNode } from "react";
export type LabelProps = Omit<LabelHTMLAttributes<HTMLLabelElement>, "className"> & {
    children?: ReactNode;
    className?: string;
};
export declare const Label: ({ children, className, ...rest }: LabelProps) => import("react").JSX.Element;
