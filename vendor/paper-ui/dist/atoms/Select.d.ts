import { type OptgroupHTMLAttributes, type OptionHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import type { ControlSize, TextVariant } from "../tokens";
export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "children" | "size"> & {
    children: ReactNode;
    size?: ControlSize;
    fontSize?: TextVariant;
    shape?: "rounded" | "pill";
    className?: string;
};
export type SelectOptionProps = Omit<OptionHTMLAttributes<HTMLOptionElement>, "children"> & {
    children: string | number;
};
export declare const SelectOption: ({ children, ...rest }: SelectOptionProps) => import("react").JSX.Element;
export type SelectGroupProps = Omit<OptgroupHTMLAttributes<HTMLOptGroupElement>, "children"> & {
    label: string;
    children: ReactNode;
};
export declare const SelectGroup: ({ children, ...rest }: SelectGroupProps) => import("react").JSX.Element;
export declare const Select: import("react").ForwardRefExoticComponent<Omit<SelectHTMLAttributes<HTMLSelectElement>, "size" | "children" | "className"> & {
    children: ReactNode;
    size?: ControlSize;
    fontSize?: TextVariant;
    shape?: "rounded" | "pill";
    className?: string;
} & import("react").RefAttributes<HTMLSelectElement>> & {
    Option: ({ children, ...rest }: SelectOptionProps) => import("react").JSX.Element;
    Group: ({ children, ...rest }: SelectGroupProps) => import("react").JSX.Element;
};
