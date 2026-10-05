import { type ReactElement, type ReactNode } from "react";
import { type BoxProps } from "../primitives";
export type TooltipProps = {
    children: ReactNode;
};
type TriggerElementProps = {
    "aria-describedby"?: string;
};
export type TooltipTriggerProps = {
    children: ReactElement<TriggerElementProps>;
    asChild?: boolean;
};
export declare const TooltipTrigger: ({ children, asChild }: TooltipTriggerProps) => import("react").JSX.Element;
export type TooltipContentProps = Omit<BoxProps<"div">, "as" | "children" | "id" | "role"> & {
    children: ReactNode;
};
export declare const TooltipContent: ({ children, width, maxWidth, className, ...rest }: TooltipContentProps) => import("react").JSX.Element | null;
export declare const Tooltip: (({ children }: TooltipProps) => import("react").JSX.Element) & {
    Trigger: ({ children, asChild }: TooltipTriggerProps) => import("react").JSX.Element;
    Content: ({ children, width, maxWidth, className, ...rest }: TooltipContentProps) => import("react").JSX.Element | null;
};
export {};
