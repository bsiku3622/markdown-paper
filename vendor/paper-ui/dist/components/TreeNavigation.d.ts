import { type ComponentPropsWithoutRef, type ElementType, type ReactElement, type ReactNode } from "react";
import { type BoxProps } from "../primitives";
export type TreeNavigationProps = Omit<BoxProps<"div">, "as"> & {
    value?: string;
    defaultValue?: string;
    expandedValues?: readonly string[];
    defaultExpandedValues?: readonly string[];
    onExpandedValuesChange?: (values: string[]) => void;
    onValueChange?: (value: string) => void;
    "aria-label"?: string;
};
type TreeItemOwn<As extends ElementType> = {
    as?: As;
    value: string;
    label: ReactNode;
    children?: ReactNode;
    className?: string;
};
export type TreeNavigationItemProps<As extends ElementType = "button"> = TreeItemOwn<As> & Omit<ComponentPropsWithoutRef<As>, keyof TreeItemOwn<As>>;
export declare const TreeNavigationItem: <As extends ElementType = "button">(props: TreeNavigationItemProps<As>) => ReactElement;
export declare const TreeNavigation: (({ value: controlledValue, defaultValue, expandedValues, defaultExpandedValues, onExpandedValuesChange, onValueChange, "aria-label": ariaLabel, className, children, ...rest }: TreeNavigationProps) => import("react").JSX.Element) & {
    Item: <As extends ElementType = "button">(props: TreeNavigationItemProps<As>) => ReactElement;
};
export {};
