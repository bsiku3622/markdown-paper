export declare const kebab: (s: string) => string;
export declare const pathToCssVar: (path: readonly string[]) => string;
export declare const pathToVarRef: (path: readonly string[]) => string;
type ValueTree = {
    readonly [k: string]: string | ValueTree;
};
export declare const walkValues: (values: ValueTree, prefix: readonly string[], visit: (path: readonly string[], value: string) => void) => void;
export declare const buildVarTree: <T extends ValueTree>(values: T, prefix: readonly string[]) => VarTree<T>;
export type VarTree<T> = {
    [K in keyof T]: T[K] extends string ? string : VarTree<T[K]>;
};
export {};
