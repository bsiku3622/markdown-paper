import type { StyleRule } from "@vanilla-extract/css";
import { type ControlSize } from "../tokens";
export declare const sizeLadderRules: Record<ControlSize, StyleRule>;
export type LadderPatch = (size: ControlSize) => Record<string, string | null>;
export declare const ladderRules: (patch?: LadderPatch) => Record<ControlSize, StyleRule>;
