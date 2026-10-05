import { type ComponentPropsWithoutRef, type ElementType, type ReactElement, type ReactNode } from "react";
import { type BoxProps } from "../primitives";
export type BreadcrumbProps = Omit<BoxProps<"nav">, "as"> & {
    separator?: ReactNode;
};
type BreadcrumbItemOwn<As extends ElementType> = {
    as?: As;
    current?: boolean;
    children: ReactNode;
    className?: string;
};
export type BreadcrumbItemProps<As extends ElementType = "span"> = BreadcrumbItemOwn<As> & Omit<ComponentPropsWithoutRef<As>, keyof BreadcrumbItemOwn<As>>;
export declare const BreadcrumbItem: <As extends ElementType = "span">(props: BreadcrumbItemProps<As>) => ReactElement;
export declare const Breadcrumb: (({ separator, "aria-label": ariaLabel, className, children, ...rest }: BreadcrumbProps) => import("react").JSX.Element) & {
    Item: <As extends ElementType = "span">(props: BreadcrumbItemProps<As>) => ReactElement;
};
export {};
