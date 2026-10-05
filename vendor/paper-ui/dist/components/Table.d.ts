import { type ReactNode } from "react";
import { type BoxProps } from "../primitives";
export type TableVariant = "plain" | "ruled" | "striped";
export type TableDensity = "compact" | "default" | "comfortable";
export type TableAlign = "start" | "center" | "end";
export type TableRootProps = Omit<BoxProps<"table">, "as"> & {
    variant?: TableVariant;
    density?: TableDensity;
};
export declare const TableRoot: ({ variant, density, className, children, ...rest }: TableRootProps) => import("react").JSX.Element;
export type TableCaptionProps = Omit<BoxProps<"caption">, "as">;
export declare const TableCaption: ({ className, ...rest }: TableCaptionProps) => import("react").JSX.Element;
export type TableHeaderProps = Omit<BoxProps<"thead">, "as"> & {
    sticky?: boolean;
};
export declare const TableHeader: ({ sticky, className, children, ...rest }: TableHeaderProps) => import("react").JSX.Element;
export type TableBodyProps = Omit<BoxProps<"tbody">, "as">;
export declare const TableBody: (props: TableBodyProps) => import("react").JSX.Element;
export type TableRowProps = Omit<BoxProps<"tr">, "as">;
export declare const TableRow: ({ className, ...rest }: TableRowProps) => import("react").JSX.Element;
type CellAxis = {
    align?: TableAlign;
    numeric?: boolean;
};
export type TableColumnProps = Omit<BoxProps<"th">, "as" | "align"> & CellAxis;
export declare const TableColumn: ({ align, numeric, className, ...rest }: TableColumnProps) => import("react").JSX.Element;
export type TableCellProps = Omit<BoxProps<"td">, "as" | "align"> & CellAxis;
export declare const TableCell: ({ align, numeric, className, ...rest }: TableCellProps) => import("react").JSX.Element;
export type Column<T> = {
    key: string;
    header: ReactNode;
    numeric?: boolean;
    align?: TableAlign;
    render: (row: T) => ReactNode;
};
export type DataTableProps<T> = Omit<TableRootProps, "children"> & {
    columns: readonly Column<T>[];
    rows: readonly T[];
    rowKey: (row: T) => string;
    caption?: ReactNode;
    empty?: ReactNode;
    stickyHeader?: boolean;
};
export declare const DataTable: <T>({ columns, rows, rowKey, variant, density, caption, empty, stickyHeader, ...rest }: DataTableProps<T>) => import("react").JSX.Element;
export type TableProps = TableRootProps;
export declare const Table: (({ variant, density, className, children, ...rest }: TableRootProps) => import("react").JSX.Element) & {
    Caption: ({ className, ...rest }: TableCaptionProps) => import("react").JSX.Element;
    Header: ({ sticky, className, children, ...rest }: TableHeaderProps) => import("react").JSX.Element;
    Body: (props: TableBodyProps) => import("react").JSX.Element;
    Row: ({ className, ...rest }: TableRowProps) => import("react").JSX.Element;
    Column: ({ align, numeric, className, ...rest }: TableColumnProps) => import("react").JSX.Element;
    Cell: ({ align, numeric, className, ...rest }: TableCellProps) => import("react").JSX.Element;
};
export {};
