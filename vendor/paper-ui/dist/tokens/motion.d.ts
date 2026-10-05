export declare const DURATION: {
    readonly instant: "0ms";
    readonly reduced: "0.01ms";
    readonly fast: "100ms";
    readonly base: "130ms";
    readonly moderate: "200ms";
    readonly slow: "300ms";
};
export type MotionDuration = keyof typeof DURATION;
export declare const EASING: {
    readonly linear: "linear";
    readonly standard: "cubic-bezier(0.4, 0, 0.2, 1)";
    readonly decelerate: "cubic-bezier(0, 0, 0.2, 1)";
    readonly accelerate: "cubic-bezier(0.4, 0, 1, 1)";
    readonly overshoot: "cubic-bezier(0.22, 1, 0.36, 1)";
};
export type MotionEasing = keyof typeof EASING;
export declare const LOOP: {
    readonly spin: "900ms";
    readonly pulse: "1400ms";
};
export type MotionRole = {
    duration: string;
    easing: string;
    offset?: string;
    scale?: string;
};
export declare const MOTION: {
    readonly hover: {
        readonly duration: "100ms";
        readonly easing: "cubic-bezier(0.4, 0, 0.2, 1)";
    };
    readonly focus: {
        readonly duration: "100ms";
        readonly easing: "cubic-bezier(0.4, 0, 0.2, 1)";
    };
    readonly state: {
        readonly duration: "130ms";
        readonly easing: "cubic-bezier(0.4, 0, 0.2, 1)";
    };
    readonly enter: {
        readonly duration: "200ms";
        readonly easing: "cubic-bezier(0.22, 1, 0.36, 1)";
        readonly offset: "6px";
        readonly scale: "0.99";
    };
    readonly exit: {
        readonly duration: "100ms";
        readonly easing: "cubic-bezier(0.4, 0, 1, 1)";
    };
};
export declare const MOTION_VALUES: {
    readonly duration: {
        readonly instant: "0ms";
        readonly reduced: "0.01ms";
        readonly fast: "100ms";
        readonly base: "130ms";
        readonly moderate: "200ms";
        readonly slow: "300ms";
    };
    readonly easing: {
        readonly linear: "linear";
        readonly standard: "cubic-bezier(0.4, 0, 0.2, 1)";
        readonly decelerate: "cubic-bezier(0, 0, 0.2, 1)";
        readonly accelerate: "cubic-bezier(0.4, 0, 1, 1)";
        readonly overshoot: "cubic-bezier(0.22, 1, 0.36, 1)";
    };
    readonly loop: {
        readonly spin: "900ms";
        readonly pulse: "1400ms";
    };
    readonly role: {
        readonly hover: {
            readonly duration: "100ms";
            readonly easing: "cubic-bezier(0.4, 0, 0.2, 1)";
        };
        readonly focus: {
            readonly duration: "100ms";
            readonly easing: "cubic-bezier(0.4, 0, 0.2, 1)";
        };
        readonly state: {
            readonly duration: "130ms";
            readonly easing: "cubic-bezier(0.4, 0, 0.2, 1)";
        };
        readonly enter: {
            readonly duration: "200ms";
            readonly easing: "cubic-bezier(0.22, 1, 0.36, 1)";
            readonly offset: "6px";
            readonly scale: "0.99";
        };
        readonly exit: {
            readonly duration: "100ms";
            readonly easing: "cubic-bezier(0.4, 0, 1, 1)";
        };
    };
};
export declare const stateTransition: (...props: string[]) => string;
