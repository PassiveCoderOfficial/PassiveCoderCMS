// Lightweight toast. Replaces Alert.alert() for success/error feedback —
// an OS modal that must be dismissed is the wrong weight for "saved".

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "./themeContext";
import { radius, shadow } from "./theme";
import { errorFeedback, successFeedback } from "./haptics";

type ToastKind = "success" | "error" | "info";

interface ToastState {
  message: string;
  kind: ToastKind;
}

interface ToastCtx {
  toast: (message: string, kind?: ToastKind) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const Ctx = createContext<ToastCtx>({ toast: () => {}, success: () => {}, error: () => {} });

export const useToast = () => useContext(Ctx);

const VISIBLE_MS = 2600;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ToastState | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();

  const dismiss = useCallback(() => {
    Animated.timing(anim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      setState(null);
    });
  }, [anim]);

  const toast = useCallback(
    (message: string, kind: ToastKind = "info") => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setState({ message, kind });
      if (kind === "success") successFeedback();
      if (kind === "error") errorFeedback();
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 220 }).start();
      hideTimer.current = setTimeout(dismiss, VISIBLE_MS);
    },
    [anim, dismiss],
  );

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  const value = React.useMemo(
    () => ({
      toast,
      success: (m: string) => toast(m, "success"),
      error: (m: string) => toast(m, "error"),
    }),
    [toast],
  );

  const accent =
    state?.kind === "success" ? palette.green600
    : state?.kind === "error" ? palette.red600
    : palette.primary600;

  return (
    <Ctx.Provider value={value}>
      {children}
      {state && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.wrap,
            {
              bottom: insets.bottom + 24,
              opacity: anim,
              transform: [
                { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
              ],
            },
          ]}
        >
          <Pressable
            onPress={dismiss}
            style={[
              styles.toast,
              shadow.raised,
              { backgroundColor: palette.bgElevated, borderColor: palette.border },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: accent }]} />
            <Text style={[styles.text, { color: palette.text }]} numberOfLines={3}>
              {state.message}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </Ctx.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16, alignItems: "center" },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    maxWidth: 520,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { flex: 1, fontSize: 13, fontWeight: "600" },
});
