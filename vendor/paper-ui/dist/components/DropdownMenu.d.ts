import { type MouseEvent, type ReactElement, type ReactNode } from "react";
export type DropdownMenuProps = {
    align?: "start" | "end";
    value?: string;
    defaultValue?: string;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    onValueChange?: (value: string) => void;
    "aria-label"?: string;
    children: ReactNode;
};
type TriggerProps = {
    onClick?: (event: MouseEvent<HTMLElement>) => void;
    "aria-haspopup"?: "menu";
    "aria-expanded"?: boolean;
};
export type DropdownMenuTriggerProps = {
    children: ReactElement<TriggerProps>;
};
export declare const DropdownMenuTrigger: ({ children }: DropdownMenuTriggerProps) => ReactElement<TriggerProps, string | import("react").JSXElementConstructor<any>>;
export type DropdownMenuContentProps = {
    children: ReactNode;
};
export declare const DropdownMenuContent: ({ children }: DropdownMenuContentProps) => import("react").JSX.Element | null;
export declare const DropdownMenu: (({ align, value: controlledValue, defaultValue, open, defaultOpen, onOpenChange, onValueChange, "aria-label": label, children }: DropdownMenuProps) => import("react").JSX.Element) & {
    Trigger: ({ children }: DropdownMenuTriggerProps) => ReactElement<TriggerProps, string | import("react").JSXElementConstructor<any>>;
    Content: ({ children }: DropdownMenuContentProps) => import("react").JSX.Element | null;
    Item: <As extends import("react").ElementType = "button">(props: import("..").MenuItemProps<As>) => ReactElement;
};
export {};
