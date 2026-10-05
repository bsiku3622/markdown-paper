import type { ReactNode } from "react";
export type PageHeaderProps = {
    children: ReactNode;
    className?: string;
};
export type PageHeaderPartProps = {
    children: ReactNode;
    className?: string;
};
export declare const PageHeaderLocation: ({ children, className }: PageHeaderPartProps) => import("react").JSX.Element;
export declare const PageHeaderContent: ({ children, className }: PageHeaderPartProps) => import("react").JSX.Element;
export declare const PageHeaderTitle: ({ children, className }: PageHeaderPartProps) => import("react").JSX.Element;
export declare const PageHeaderDescription: ({ children, className }: PageHeaderPartProps) => import("react").JSX.Element;
export declare const PageHeaderActions: ({ children, className }: PageHeaderPartProps) => import("react").JSX.Element;
export declare const PageHeader: (({ children, className }: PageHeaderProps) => import("react").JSX.Element) & {
    Location: ({ children, className }: PageHeaderPartProps) => import("react").JSX.Element;
    Content: ({ children, className }: PageHeaderPartProps) => import("react").JSX.Element;
    Title: ({ children, className }: PageHeaderPartProps) => import("react").JSX.Element;
    Description: ({ children, className }: PageHeaderPartProps) => import("react").JSX.Element;
    Actions: ({ children, className }: PageHeaderPartProps) => import("react").JSX.Element;
};
