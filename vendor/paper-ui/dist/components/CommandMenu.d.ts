import { type ReactNode } from "react";
import { type BoxProps } from "../primitives";
export type CommandMenuProps = Omit<BoxProps<"div">, "children" | "onSelect"> & {
    query?: string;
    defaultQuery?: string;
    onQueryChange?: (query: string) => void;
    onSelect?: (value: string) => void;
    placeholder?: string;
    empty?: ReactNode;
    children: ReactNode;
};
export type CommandMenuGroupProps = {
    label?: ReactNode;
    children: ReactNode;
};
export declare const CommandMenuGroup: ({ label, children }: CommandMenuGroupProps) => import("react").JSX.Element | null;
export type CommandMenuItemProps = {
    value: string;
    description?: ReactNode;
    keywords?: readonly string[];
    icon?: ReactNode;
    shortcut?: ReactNode;
    disabled?: boolean;
    children: ReactNode;
};
export declare const CommandMenuItem: ({ value, description, keywords, icon, shortcut, disabled, children }: CommandMenuItemProps) => import("react").JSX.Element | null;
export type CommandMenuEmptyProps = {
    children: ReactNode;
};
export declare const CommandMenuEmpty: ({ children }: CommandMenuEmptyProps) => import("react").JSX.Element;
export declare const CommandMenu: (({ query, defaultQuery, onQueryChange, onSelect, placeholder, empty, className, children, ...rest }: CommandMenuProps) => import("react").JSX.Element) & {
    Group: ({ label, children }: CommandMenuGroupProps) => import("react").JSX.Element | null;
    Item: ({ value, description, keywords, icon, shortcut, disabled, children }: CommandMenuItemProps) => import("react").JSX.Element | null;
    Empty: ({ children }: CommandMenuEmptyProps) => import("react").JSX.Element;
};
