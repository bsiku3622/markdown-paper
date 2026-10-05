import { type ReactElement, type ReactNode } from "react";
export type StepsProps = {
    value?: string;
    defaultValue?: string;
    orientation?: "horizontal" | "vertical";
    onValueChange?: (value: string) => void;
    "aria-label"?: string;
    className?: string;
    children: ReactNode;
};
export type StepItemProps = {
    value: string;
    description?: ReactNode;
    children: ReactNode;
};
export declare const StepItem: (props: StepItemProps) => ReactElement;
export declare const Steps: (({ value: controlledValue, defaultValue, orientation, onValueChange, "aria-label": ariaLabel, className, children }: StepsProps) => import("react").JSX.Element) & {
    Item: (props: StepItemProps) => ReactElement;
};
