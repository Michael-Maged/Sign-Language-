import React, { useRef, useState } from "react";
import {
  ActivityIndicator, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import * as Speech from "expo-speech";
import { predictWord, WLASLPrediction } from "../services/WLASLService";
import { P } from "../theme";

const FRAMES_COUNT   = 30;
const FRAME_INTERVAL = 67;   // ms — ~15 fps
const MIN_CONFIDENCE = 0.6;

export default function WLASLScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [recording, setRecording]       = useState(false);
  const [progress, setProgress]         = useState(0);
  const [prediction, setPrediction]     = useState<WLASLPrediction | null>(null);
  const [error, setError]               = useState("");
  const [sentence, setSentence]         = useState<string[]>([]);

  const cameraRef   = useRef<CameraView>(null);
  const sentenceRef = useRef<ScrollView>(null);

  async function handleRecord() {
    if (recording || !cameraRef.current) return;
    setRecording(true);
    setProgress(0);
    setPrediction(null);
    setError("");

    const uris: string[] = [];
    try {
      for (let i = 0; i < FRAMES_COUNT; i++) {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
        if (photo) uris.push(photo.uri);
        setProgress(i + 1);
        await new Promise<void>((r) => setTimeout(r, FRAME_INTERVAL));
      }
      const result = await predictWord(uris);
      setPrediction(result);
      if (result.confidence >= MIN_CONFIDENCE) {
        try { Speech.speak(result.word); } catch {}
      }
    } catch (e: any) {
      setError(e.message ?? "Unknown error");
    } finally {
      setRecording(false);
      setProgress(0);
    }
  }

  function addWord() {
    if (!prediction || prediction.confidence < MIN_CONFIDENCE) return;
    setSentence((prev) => {
      const next = [...prev, prediction.word];
      setTimeout(() => sentenceRef.current?.scrollToEnd({ animated: true }), 50);
      return next;
    });
  }

  function clearSentence() { setSentence([]); }

  function speakSentence() {
    if (sentence.length === 0) return;
    try { Speech.speak(sentence.join(" ")); } catch {}
  }

  if (!permission) return <View style={s.container} />;
  if (!permission.granted) {
    return (
      <View style={s.permissionContainer}>
        <Text style={s.permissionText}>Camera access is needed to detect hand signs.</Text>
        <TouchableOpacity style={s.permissionButton} onPress={requestPermission}>
          <Text style={s.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const canAdd = !!prediction && prediction.confidence >= MIN_CONFIDENCE;
  const confPct = prediction ? Math.round(prediction.confidence * 100) : 0;
  const confColor =
    !prediction                  ? P.textMute :
    prediction.confidence >= 0.8 ? P.ok :
    prediction.confidence >= 0.6 ? P.warn : P.danger;

  return (
    <View style={s.container}>
      {/* Full-screen camera */}
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="front" />

      {/* Recording progress bar */}
      {recording && (
        <View pointerEvents="none" style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${(progress / FRAMES_COUNT) * 100}%` as any }]} />
        </View>
      )}

      {/* Top sentence panel */}
      <SafeAreaView edges={["top"]} style={s.topPanel}>
        <View style={s.topPanelInner}>
          <ScrollView
            ref={sentenceRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.sentenceScroll}
            style={{ flex: 1 }}
          >
            {sentence.length === 0
              ? <Text style={s.sentencePlaceholder}>Sign a word → tap Add</Text>
              : sentence.map((w, i) => (
                  <View key={i} style={s.wordChip}>
                    <Text style={s.wordChipText}>{w}</Text>
                  </View>
                ))
            }
          </ScrollView>
          {sentence.length > 0 && (
            <TouchableOpacity style={s.ttsBtn} onPress={speakSentence}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"
                stroke={P.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M11 5 6 9H2v6h4l5 4V5z" />
                <Path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <Path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </Svg>
              <Text style={s.ttsBtnText}>Read</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {/* Center prediction card */}
      {(prediction || recording) && (
        <View style={s.predCard}>
          {recording ? (
            <View style={{ alignItems: "center", gap: 10 }}>
              <ActivityIndicator color={P.accent} size="large" />
              <Text style={{ color: P.textDim, fontSize: 13 }}>
                Capturing… {progress}/{FRAMES_COUNT}
              </Text>
            </View>
          ) : prediction ? (
            <>
              <Text style={[s.predWord, { color: confColor }]}>{prediction.word}</Text>
              <View style={s.confBarTrack}>
                <View style={[s.confBarFill, { width: `${confPct}%` as any, backgroundColor: confColor }]} />
              </View>
              <Text style={s.confLabel}>{confPct}% confidence</Text>
            </>
          ) : null}
        </View>
      )}

      {!prediction && !recording && !!error && (
        <View style={s.errorCard}>
          <Text style={s.errorText}>⚠ {error}</Text>
        </View>
      )}

      {/* Bottom action row */}
      <SafeAreaView edges={["bottom"]} style={s.bottomRow}>
        {/* Clear */}
        <TouchableOpacity
          style={[s.circleBtn, sentence.length === 0 && s.circleBtnDisabled]}
          onPress={clearSentence}
          disabled={sentence.length === 0}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"
            stroke={P.textDim} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </Svg>
        </TouchableOpacity>

        {/* Capture — large center button */}
        <TouchableOpacity
          style={[s.captureBtn, recording && s.captureBtnRecording]}
          onPress={handleRecord}
          disabled={recording}
          activeOpacity={0.8}
        >
          {recording ? (
            <View style={s.captureStop} />
          ) : (
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none"
              stroke={P.bg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Circle cx="12" cy="12" r="10" />
              <Circle cx="12" cy="12" r="3" />
            </Svg>
          )}
        </TouchableOpacity>

        {/* Add */}
        <TouchableOpacity
          style={[s.circleBtn, !canAdd && s.circleBtnDisabled]}
          onPress={addWord}
          disabled={!canAdd}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"
            stroke={canAdd ? P.accent : P.textMute} strokeWidth={2.5}
            strokeLinecap="round" strokeLinejoin="round">
            <Path d="M20 6 9 17l-5-5" />
          </Svg>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container:           { flex: 1, backgroundColor: "#000" },
  permissionContainer: { flex: 1, backgroundColor: P.bg, alignItems: "center", justifyContent: "center", padding: 32 },
  permissionText:      { color: P.textDim, textAlign: "center", fontSize: 16, lineHeight: 24, marginBottom: 24 },
  permissionButton:    { backgroundColor: P.accent, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 12 },
  permissionButtonText:{ color: P.bg, fontSize: 15, fontWeight: "700" },

  progressTrack: {
    position: "absolute", top: 0, left: 0, right: 0, height: 3,
    backgroundColor: "rgba(255,255,255,0.12)", zIndex: 10,
  },
  progressFill: {
    height: 3, backgroundColor: P.accent,
  },

  // Top sentence panel
  topPanel: {
    position: "absolute", top: 0, left: 0, right: 0,
  },
  topPanelInner: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 12, marginTop: 8,
    backgroundColor: "rgba(26,30,42,0.88)",
    borderRadius: 16, borderWidth: 0.5, borderColor: P.borderH,
    paddingHorizontal: 12, paddingVertical: 8,
    minHeight: 48,
  },
  sentenceScroll:      { alignItems: "center", paddingRight: 4 },
  sentencePlaceholder: { color: P.textMute, fontSize: 13, fontStyle: "italic" },
  wordChip: {
    backgroundColor: P.accentDim, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4, marginRight: 6,
    borderWidth: 1, borderColor: "rgba(31,227,240,0.2)",
  },
  wordChipText: { color: P.accent, fontWeight: "700", fontSize: 14 },
  ttsBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: P.surface2, borderRadius: 10,
    borderWidth: 0.5, borderColor: P.borderH,
    paddingHorizontal: 10, paddingVertical: 6, marginLeft: 8,
  },
  ttsBtnText: { color: P.accent, fontSize: 13, fontWeight: "600" },

  // Prediction card
  predCard: {
    position: "absolute",
    top: "35%",
    left: 24, right: 24,
    backgroundColor: "rgba(26,30,42,0.9)",
    borderRadius: 20, borderWidth: 0.5, borderColor: P.borderH,
    padding: 20, alignItems: "center",
  },
  predWord: {
    fontSize: 42, fontWeight: "800", letterSpacing: 1, marginBottom: 12,
  },
  confBarTrack: {
    width: "100%", height: 6, backgroundColor: P.surface2,
    borderRadius: 3, overflow: "hidden", marginBottom: 8,
  },
  confBarFill: { height: 6, borderRadius: 3 },
  confLabel:   { fontSize: 13, color: P.textMute },

  errorCard: {
    position: "absolute", top: "40%", left: 24, right: 24,
    backgroundColor: "rgba(255,107,122,0.1)",
    borderRadius: 12, borderWidth: 0.5, borderColor: P.danger,
    padding: 14, alignItems: "center",
  },
  errorText: { color: P.danger, fontSize: 14 },

  // Bottom row
  bottomRow: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingBottom: 24, gap: 28,
  },
  circleBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "rgba(26,30,42,0.88)",
    borderWidth: 0.5, borderColor: P.borderH,
    alignItems: "center", justifyContent: "center",
  },
  circleBtnDisabled: { opacity: 0.35 },
  captureBtn: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: P.accent,
    alignItems: "center", justifyContent: "center",
    shadowColor: P.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  captureBtnRecording: {
    backgroundColor: P.danger,
    shadowColor: P.danger,
  },
  captureStop: {
    width: 24, height: 24, borderRadius: 4,
    backgroundColor: P.bg,
  },
});
