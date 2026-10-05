import { type ReactNode } from "react";
import { type ButtonProps } from "../atoms";
export type ModalSize = "sm" | "md" | "lg";
export type ModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    size?: ModalSize;
    children: ReactNode;
    closeOnBackdrop?: boolean;
    closeOnEscape?: boolean;
    "aria-label"?: string;
};
export type ModalHeaderProps = {
    children: ReactNode;
    closeButton?: boolean;
};
export declare const ModalHeader: ({ children, closeButton }: ModalHeaderProps) => import("react").JSX.Element;
export declare const ModalTitle: ({ children }: {
    children: ReactNode;
}) => import("react").JSX.Element;
export declare const ModalDescription: ({ children }: {
    children: ReactNode;
}) => import("react").JSX.Element;
export declare const ModalBody: ({ children }: {
    children: ReactNode;
}) => import("react").JSX.Element;
export declare const ModalFooter: ({ children }: {
    children: ReactNode;
}) => import("react").JSX.Element;
export type ModalCloseProps = Omit<ButtonProps<"button">, "onClick">;
export declare const ModalClose: ({ children, ...rest }: ModalCloseProps) => import("react").JSX.Element;
export declare const Modal: (({ open, onOpenChange, size, children, closeOnBackdrop, closeOnEscape, "aria-label": ariaLabel }: ModalProps) => import("react").ReactPortal | null) & {
    Header: ({ children, closeButton }: ModalHeaderProps) => import("react").JSX.Element;
    Title: ({ children }: {
        children: ReactNode;
    }) => import("react").JSX.Element;
    Description: ({ children }: {
        children: ReactNode;
    }) => import("react").JSX.Element;
    Body: ({ children }: {
        children: ReactNode;
    }) => import("react").JSX.Element;
    Footer: ({ children }: {
        children: ReactNode;
    }) => import("react").JSX.Element;
    Close: ({ children, ...rest }: ModalCloseProps) => import("react").JSX.Element;
};
