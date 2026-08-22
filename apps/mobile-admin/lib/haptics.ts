// Thin wrapper over expo-haptics so call sites read as intent ("this was a
// success", "this was destructive") rather than a specific vibration style,
// and so a missing/unsupported haptics module can never crash a screen.

import * as Haptics from "expo-haptics";

function safe(fn: () => Promise<unknown>) {
  fn().catch(() => {});
}

/** Light tick — row taps, toggles, reorder. */
export function tapFeedback() {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** Medium thud — committing something (add block, send). */
export function actionFeedback() {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

export function successFeedback() {
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

export function errorFeedback() {
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}

export function warningFeedback() {
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}
