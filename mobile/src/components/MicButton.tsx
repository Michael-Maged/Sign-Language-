import React, { useEffect, useRef, useState } from "react";
import { TouchableOpacity, ActivityIndicator, Animated, Easing } from "react-native";
import Svg, { Rect, Path } from "react-native-svg";
import { startRecording, stopRecordingAndTranscribe } from "../services/AudioService";
import { P } from "../theme";

type MicState = "idle" | "recording" | "processing";

interface Props {
  onResult: (text: string) => void;
  onError: (msg: string) => void;
  onStateChange?: (state: MicState) => void;
}

export default function MicButton({ onResult, onError, onStateChange }: Props) {
  const [state, setState] = useState<MicState>("idle");
  const scaleAnim = useRef(new Animated.Value(1)).current;

  function update(s: MicState) {
    setState(s);
    onStateChange?.(s);
  }

  useEffect(() => {
    if (state === "recording") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.05, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1,    duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      scaleAnim.stopAnimation();
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    }
  }, [state]);

  async function handlePress() {
    if (state === "processing") return;

    if (state !== "recording") {
      try {
        await startRecording();
        update("recording");
      } catch {
        onError("Could not start recording");
      }
    } else {
      update("processing");
      try {
        const text = await stopRecordingAndTranscribe();
        onResult(text);
      } catch {
        onError("Could not reach server — is the backend running?");
        update("idle");
      }
    }
  }

  const isRecording  = state === "recording";
  const isProcessing = state === "processing";

  return (
    <TouchableOpacity onPress={handlePress} disabled={isProcessing} activeOpacity={0.85}>
      <Animated.View style={{
        width: 132, height: 132, borderRadius: 66,
        backgroundColor: isRecording ? P.accent : P.surface2,
        borderWidth: isRecording ? 0 : 1,
        borderColor: P.borderH,
        alignItems: "center", justifyContent: "center",
        transform: [{ scale: scaleAnim }],
        shadowColor: isRecording ? P.accent : "#000",
        shadowOffset: { width: 0, height: isRecording ? 18 : 12 },
        shadowOpacity: isRecording ? 0.45 : 0.4,
        shadowRadius: isRecording ? 48 : 30,
        elevation: isRecording ? 16 : 8,
      }}>
        {isProcessing ? (
          <ActivityIndicator color={P.accent} size="large" />
        ) : (
          <Svg width={46} height={46} viewBox="0 0 24 24" fill="none"
            stroke={isRecording ? P.bg : P.accent}
            strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Rect x="9" y="2.5" width="6" height="12" rx="3" />
            <Path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
            <Path d="M12 18v3.5" />
          </Svg>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}
