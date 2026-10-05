import { type ReactNode } from "react";
import "../styles/theme.css";
import "../styles/utility.css";
import "../styles/color.css";
import { type Theme } from "../primitives/theme-context";
export type PaperProviderProps = {
    defaultTheme?: Theme;
    children?: ReactNode;
};
export declare const PaperProvider: ({ defaultTheme, children }: PaperProviderProps) => import("react").JSX.Element;
