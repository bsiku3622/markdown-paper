import { type ReactNode } from "react";
import { type Accent, type Variant } from "../resolvers";
export type AlertProps = {
    accent?: Accent;
    variant?: Variant;
    children: ReactNode;
    className?: string;
};
export type AlertPartProps = {
    children: ReactNode;
};
export declare const AlertIcon: ({ children }: AlertPartProps) => import("react").JSX.Element;
export declare const AlertTitle: ({ children }: AlertPartProps) => import("react").JSX.Element;
export declare const AlertDescription: ({ children }: AlertPartProps) => import("react").JSX.Element;
export declare const Alert: (({ accent, variant, children, className }: AlertProps) => import("react").JSX.Element) & {
    Icon: ({ children }: AlertPartProps) => import("react").JSX.Element;
    Title: ({ children }: AlertPartProps) => import("react").JSX.Element;
    Description: ({ children }: AlertPartProps) => import("react").JSX.Element;
};
