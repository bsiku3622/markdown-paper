export declare const useControllableState: <T>({ value, defaultValue, onValueChange, }: {
    value?: T;
    defaultValue: T;
    onValueChange?: (value: T) => void;
}) => readonly [T, (value: T) => void];
