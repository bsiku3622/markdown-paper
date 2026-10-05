import { type ComponentPropsWithoutRef, type ElementType, type ReactElement, type ReactNode } from "react";
export type NavbarProps = {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    width?: "full" | "content";
    children: ReactNode;
};
export type NavbarBrandProps = {
    children: ReactNode;
    className?: string;
};
export declare const NavbarBrand: ({ children, className }: NavbarBrandProps) => import("react").JSX.Element;
export type NavbarActionsProps = {
    children: ReactNode;
    className?: string;
};
export declare const NavbarActions: ({ children, className }: NavbarActionsProps) => import("react").JSX.Element;
type NavbarItemOwn<As extends ElementType> = {
    as?: As;
    value: string;
    children: ReactNode;
    className?: string;
};
export type NavbarItemProps<As extends ElementType = "button"> = NavbarItemOwn<As> & Omit<ComponentPropsWithoutRef<As>, keyof NavbarItemOwn<As>>;
export declare const NavbarItem: <As extends ElementType = "button">(props: NavbarItemProps<As>) => ReactElement;
export declare const Navbar: (({ value: controlledValue, defaultValue, onValueChange, width, children }: NavbarProps) => import("react").JSX.Element) & {
    Brand: ({ children, className }: NavbarBrandProps) => import("react").JSX.Element;
    Item: <As extends ElementType = "button">(props: NavbarItemProps<As>) => ReactElement;
    Actions: ({ children, className }: NavbarActionsProps) => import("react").JSX.Element;
};
export {};
