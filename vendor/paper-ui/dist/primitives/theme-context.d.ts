export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
export declare const ResolvedThemeContext: import("react").Context<ResolvedTheme>;
export declare const useResolvedTheme: () => ResolvedTheme;
export type ThemeControl = {
    theme: Theme;
    resolved: ResolvedTheme;
    setTheme: (theme: Theme) => void;
};
export declare const ThemeControlContext: import("react").Context<ThemeControl | null>;
export declare const useTheme: () => ThemeControl;
