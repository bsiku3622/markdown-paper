import type { ReactNode } from "react";
import { type Accent } from "../resolvers";
export type BannerProps = {
    accent?: Accent;
    children: ReactNode;
    className?: string;
};
export type BannerPartProps = {
    children: ReactNode;
};
export declare const BannerContent: ({ children }: BannerPartProps) => import("react").JSX.Element;
export declare const BannerAction: ({ children }: BannerPartProps) => import("react").JSX.Element;
export declare const Banner: (({ accent, children, className }: BannerProps) => import("react").JSX.Element) & {
    Content: ({ children }: BannerPartProps) => import("react").JSX.Element;
    Action: ({ children }: BannerPartProps) => import("react").JSX.Element;
};
