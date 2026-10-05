import { type ComponentPropsWithoutRef, type ElementType, type ReactElement, type ReactNode } from "react";
import { type BoxProps } from "../primitives";
export type MenuProps = Omit<BoxProps<"div">, "as"> & {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    "aria-label"?: string;
};
type MenuItemOwn<As extends ElementType> = {
    as?: As;
    value: string;
    description?: ReactNode;
    icon?: ReactNode;
    shortcut?: ReactNode;
    disabled?: boolean;
    danger?: boolean;
    children: ReactNode;
    className?: string;
};
export type MenuItemProps<As extends ElementType = "button"> = MenuItemOwn<As> & Omit<ComponentPropsWithoutRef<As>, keyof MenuItemOwn<As>>;
export declare const MenuItem: <As extends ElementType = "button">(props: MenuItemProps<As>) => ReactElement;
export declare const Menu: (({ value: controlledValue, defaultValue, onValueChange, className, children, "aria-label": ariaLabel, ...rest }: MenuProps) => import("react").JSX.Element) & {
    Item: <As extends ElementType = "button">(props: MenuItemProps<As>) => ReactElement;
};
export {};
