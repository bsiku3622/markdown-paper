import type { ReactNode } from "react";
export type EmptyStateProps = {
    children: ReactNode;
    className?: string;
};
export type EmptyStatePartProps = {
    children: ReactNode;
};
export declare const EmptyStateTitle: ({ children }: EmptyStatePartProps) => import("react").JSX.Element;
export declare const EmptyStateDescription: ({ children }: EmptyStatePartProps) => import("react").JSX.Element;
export declare const EmptyStateAction: ({ children }: EmptyStatePartProps) => import("react").JSX.Element;
export declare const EmptyState: (({ children, className }: EmptyStateProps) => import("react").JSX.Element) & {
    Title: ({ children }: EmptyStatePartProps) => import("react").JSX.Element;
    Description: ({ children }: EmptyStatePartProps) => import("react").JSX.Element;
    Action: ({ children }: EmptyStatePartProps) => import("react").JSX.Element;
};
