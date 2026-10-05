import type { AnchorHTMLAttributes, ReactNode } from "react";
export type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className"> & {
    children?: ReactNode;
    className?: string;
};
export declare const Link: ({ children, className, ...rest }: LinkProps) => import("react").JSX.Element;
