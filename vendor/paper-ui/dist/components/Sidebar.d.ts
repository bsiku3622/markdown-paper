import { type ComponentPropsWithoutRef, type ElementType, type ReactElement, type ReactNode } from "react";
import { type BadgeProps } from "../atoms";
import { type BoxProps } from "../primitives";
export type SidebarProps = Omit<BoxProps<"nav">, "as"> & {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
};
export type SidebarGroupProps = Omit<BoxProps<"div">, "children"> & {
    label?: ReactNode;
    children: ReactNode;
};
export declare const SidebarGroup: ({ label, children, className, ...rest }: SidebarGroupProps) => import("react").JSX.Element;
type SidebarItemOwn<As extends ElementType> = {
    as?: As;
    value: string;
    disabled?: boolean;
    children: ReactNode;
    className?: string;
};
export type SidebarItemProps<As extends ElementType = "button"> = SidebarItemOwn<As> & Omit<ComponentPropsWithoutRef<As>, keyof SidebarItemOwn<As>>;
export declare const SidebarItem: <As extends ElementType = "button">(props: SidebarItemProps<As>) => ReactElement;
export type SidebarBadgeProps = BadgeProps & {
    selectedVariant?: BadgeProps["variant"];
};
export declare const SidebarBadge: ({ variant, selectedVariant, className, ...rest }: SidebarBadgeProps) => import("react").JSX.Element;
export declare const Sidebar: (({ value: controlledValue, defaultValue, onValueChange, className, children, ...rest }: SidebarProps) => import("react").JSX.Element) & {
    Group: ({ label, children, className, ...rest }: SidebarGroupProps) => import("react").JSX.Element;
    Item: <As extends ElementType = "button">(props: SidebarItemProps<As>) => ReactElement;
    Badge: ({ variant, selectedVariant, className, ...rest }: SidebarBadgeProps) => import("react").JSX.Element;
};
export {};
