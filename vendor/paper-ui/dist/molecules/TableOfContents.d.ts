import { type ComponentPropsWithoutRef, type ElementType, type ReactElement, type ReactNode } from "react";
import { type BoxProps } from "../primitives";
export type TableOfContentsProps = Omit<BoxProps<"nav">, "as"> & {
    value?: string;
    defaultValue?: string;
    label?: ReactNode;
    onValueChange?: (value: string) => void;
};
type TocItemOwn<As extends ElementType> = {
    as?: As;
    value: string;
    depth?: 0 | 1 | 2;
    children: ReactNode;
    className?: string;
};
export type TableOfContentsItemProps<As extends ElementType = "a"> = TocItemOwn<As> & Omit<ComponentPropsWithoutRef<As>, keyof TocItemOwn<As>>;
export declare const TableOfContentsItem: <As extends ElementType = "a">(props: TableOfContentsItemProps<As>) => ReactElement;
export declare const TableOfContents: (({ value: controlledValue, defaultValue, label, onValueChange, className, children, ...rest }: TableOfContentsProps) => import("react").JSX.Element) & {
    Item: <As extends ElementType = "a">(props: TableOfContentsItemProps<As>) => ReactElement;
};
export {};
