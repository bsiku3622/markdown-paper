import { type ReactElement } from "react";
import type { IconSize } from "../primitives";
import { type ButtonProps } from "./Button";
import { type IconProps } from "../primitives";
export type IconButtonProps = Omit<ButtonProps<"button">, "children" | "fontSize"> & {
    iconSize?: IconSize;
    children: ReactElement<IconProps>;
    "aria-label": string;
};
export declare const IconButton: import("react").ForwardRefExoticComponent<Omit<IconButtonProps, "ref"> & import("react").RefAttributes<HTMLButtonElement>>;
