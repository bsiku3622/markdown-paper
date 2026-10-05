import { type ReactElement, type ReactNode } from "react";
import { type StackProps } from "../primitives";
type ControlProps = {
    id?: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean | "true" | "false";
};
export type FormFieldAlign = NonNullable<StackProps["align"]>;
export type FormFieldProps = {
    children: ReactNode;
    className?: string;
    id?: string;
    align?: FormFieldAlign;
};
export type FormFieldLabelProps = {
    children: ReactNode;
};
export declare const FormFieldLabel: ({ children }: FormFieldLabelProps) => import("react").JSX.Element;
export type FormFieldControlProps = {
    children: ReactElement<ControlProps>;
};
export declare const FormFieldControl: ({ children }: FormFieldControlProps) => ReactElement<ControlProps, string | import("react").JSXElementConstructor<any>>;
export type FormFieldNoteProps = {
    children: ReactNode;
};
export declare const FormFieldHint: ({ children }: FormFieldNoteProps) => import("react").JSX.Element | null;
export declare const FormFieldError: ({ children }: FormFieldNoteProps) => import("react").JSX.Element;
export declare const FormField: (({ children, className, id, align }: FormFieldProps) => import("react").JSX.Element) & {
    Label: ({ children }: FormFieldLabelProps) => import("react").JSX.Element;
    Control: ({ children }: FormFieldControlProps) => ReactElement<ControlProps, string | import("react").JSXElementConstructor<any>>;
    Hint: ({ children }: FormFieldNoteProps) => import("react").JSX.Element | null;
    Error: ({ children }: FormFieldNoteProps) => import("react").JSX.Element;
};
export {};
