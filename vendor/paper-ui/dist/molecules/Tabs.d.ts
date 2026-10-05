import { type ReactNode } from "react";
import { type BoxProps } from "../primitives";
import type { ControlSize } from "../tokens";
export type TabsProps = Omit<BoxProps<"div">, "as" | "children"> & {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    size?: ControlSize;
    children: ReactNode;
};
export type TabsListProps = Omit<BoxProps<"div">, "as">;
export declare const TabsList: ({ className, onKeyDown, ...rest }: TabsListProps) => import("react").JSX.Element;
export type TabsTriggerProps = Omit<BoxProps<"button">, "as" | "value"> & {
    value: string;
};
export declare const TabsTrigger: ({ value, className, onClick, ...rest }: TabsTriggerProps) => import("react").JSX.Element;
export type TabsContentProps = Omit<BoxProps<"div">, "as" | "value"> & {
    value: string;
};
export declare const TabsContent: ({ value, className, ...rest }: TabsContentProps) => import("react").JSX.Element;
export declare const Tabs: (({ value: controlledValue, defaultValue, onValueChange, size, className, children, ...rest }: TabsProps) => import("react").JSX.Element) & {
    List: ({ className, onKeyDown, ...rest }: TabsListProps) => import("react").JSX.Element;
    Trigger: ({ value, className, onClick, ...rest }: TabsTriggerProps) => import("react").JSX.Element;
    Content: ({ value, className, ...rest }: TabsContentProps) => import("react").JSX.Element;
};
