export type PaginationProps = {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    "aria-label"?: string;
    className?: string;
    variant?: PaginationVariant;
};
export type PaginationVariant = "outline" | "soft" | "minimal";
export declare const Pagination: ({ page, totalPages, onPageChange, "aria-label": ariaLabel, className, variant }: PaginationProps) => import("react").JSX.Element;
