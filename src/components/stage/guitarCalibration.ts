/**
 * Calibration of public/models/acoustic_guitar.glb, measured from the GLB accessors.
 *
 * "Model space" = coordinates after the `acoustic_body` node transform (scale 100, -90deg X):
 *   X = width (low E string on -X), Y = length (up, headstock at +Y), Z = toward the soundboard (+Z = front).
 * Units are roughly meters (body ~0.40 wide, total length ~1.045).
 */
export const MODEL_URL = '/models/acoustic_guitar.glb';

export const MODEL_BOUNDS = { minY: -0.013, maxY: 1.032, halfWidth: 0.2, halfDepth: 0.05 };
/** Vertical center of the model; the model is re-centered around this point. */
export const MODEL_CENTER_Y = (MODEL_BOUNDS.minY + MODEL_BOUNDS.maxY) / 2;

export const NUT_Y = 0.8639;
export const SADDLE_Y = 0.2;
export const SCALE_LENGTH = NUT_Y - SADDLE_Y;

/** Body/neck joint (14th fret) and where the fretboard extension ends over the soundhole. */
export const NECK_JOINT_Y = 0.495;
export const FRETBOARD_END_Y = 0.3977;
export const FRETBOARD_Z = 0.0545;
export const FRET_COUNT = 20;

export const SOUNDHOLE = { y: 0.351, radius: 0.0505 };
export const TOP_Z = 0.0502;
export const BRIDGE = { minY: 0.165, maxY: 0.215, halfWidth: 0.085 };

/** String index 0 = low E ... 5 = high E (matches ChordPosition.frets order). */
export const STRING_NODE_NAMES = ['E_string', 'A_string', 'D_string', 'G_string', 'B_string', 'E_high_string'] as const;
const STRING_X_AT_NUT = [-0.0171, -0.0097, -0.0026, 0.0047, 0.0116, 0.0183];
const STRING_X_AT_SADDLE = [-0.0253, -0.0149, -0.0044, 0.0065, 0.0178, 0.0281];
const STRING_Z_AT_NUT = 0.0542;
const STRING_Z_AT_SADDLE = 0.06;
/** Strings are lifted along +Z so the added fret wires never cover them near the nut. */
export const STRING_LIFT_Z = 0.0012;
export const WOUND_STRING_COUNT = 4;

const FRETBOARD_HALF_WIDTH_AT_NUT = 0.021;
const FRETBOARD_HALF_WIDTH_SLOPE = 0.01429; // per unit of Y toward the body

/** Model-space Y of fret wire n (0 = nut), 12-TET. */
export function fretY(fret: number): number {
  return NUT_Y - SCALE_LENGTH * (1 - Math.pow(2, -fret / 12));
}

/** Y where a finger presses for `fret` (midpoint between wires). */
export function fingerY(fret: number): number {
  return (fretY(fret - 1) + fretY(fret)) / 2;
}

function speakingT(y: number): number {
  return (NUT_Y - y) / SCALE_LENGTH; // 0 at nut, 1 at saddle
}

export function stringX(stringIdx: number, y: number): number {
  const t = speakingT(y);
  return STRING_X_AT_NUT[stringIdx] + (STRING_X_AT_SADDLE[stringIdx] - STRING_X_AT_NUT[stringIdx]) * t;
}

export function stringZ(y: number): number {
  return STRING_Z_AT_NUT + STRING_LIFT_Z + (STRING_Z_AT_SADDLE - STRING_Z_AT_NUT) * speakingT(y);
}

export function fretboardHalfWidth(y: number): number {
  return FRETBOARD_HALF_WIDTH_AT_NUT + FRETBOARD_HALF_WIDTH_SLOPE * (NUT_Y - y);
}

/** Hit classification by model-space Y: anything above the body joint is neck/headstock. */
export function isNeckHit(modelY: number): boolean {
  return modelY > NECK_JOINT_Y;
}

/** Model-space point the camera frames in neck mode (open position up to ~12th fret). */
export const NECK_FOCUS_Y = (NUT_Y + fretY(12)) / 2 - 0.02;
