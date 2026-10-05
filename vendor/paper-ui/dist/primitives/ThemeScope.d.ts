import type { ReactNode } from "react";
export type ThemeScopeProps = {
    theme: "light" | "dark" | "inverse";
    children?: ReactNode;
    className?: string;
};
export declare const ThemeScope: ({ theme, children, className }: ThemeScopeProps) => import("react").JSX.Element;
