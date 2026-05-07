import React, { useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Speech from "expo-speech";
import { predictWord, WLASLPrediction } from "../services/WLASLService";

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

  function deleteWord()    { setSentence((s) => s.slice(0, -1)); }
  function clearSentence() { setSentence([]); }

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera access is needed to detect hand signs.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const canAdd = !!prediction && prediction.confidence >= MIN_CONFIDENCE;
  const confColor =
    !prediction                  ? "#94A3B8" :
    prediction.confidence >= 0.8 ? "#4ADE80" :
    prediction.confidence >= 0.6 ? "#FACC15" : "#F87171";

  return (
    <View style={styles.container}>
      {/* Sentence strip */}
      <SafeAreaView edges={["top"]} style={styles.sentenceBar}>
        <ScrollView
          ref={sentenceRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sentenceScroll}
        >
          {sentence.length === 0
            ? <Text style={styles.sentencePlaceholder}>Sign a word → tap Add ✓</Text>
            : sentence.map((w, i) => (
                <View key={i} style={styles.wordChip}>
                  <Text style={styles.wordChipText}>{w}</Text>
                </View>
              ))
          }
        </ScrollView>
      </SafeAreaView>

      {/* Camera */}
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="front" />
        {recording && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(progress / FRAMES_COUNT) * 100}%` as any }]} />
          </View>
        )}
      </View>

      {/* Bottom panel */}
      <View style={styles.bottomPanel}>
        {!!error && (
          <View style={styles.errorRow}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </View>
        )}

        <View style={styles.predictionRow}>
          {recording ? (
            <View style={styles.recordingRow}>
              <ActivityIndicator color="#2196F3" />
              <Text style={styles.recordingText}>Capturing… {progress}/{FRAMES_COUNT}</Text>
            </View>
          ) : prediction ? (
            <>
              <Text style={[styles.bigWord, { color: confColor }]}>{prediction.word}</Text>
              <Text style={styles.confLabel}>{Math.round(prediction.confidence * 100)}%</Text>
            </>
          ) : (
            <Text style={styles.hintText}>Tap Record and sign a word</Text>
          )}
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.btnSecondary, sentence.length === 0 && styles.btnDisabled]}
            onPress={deleteWord} disabled={sentence.length === 0}
          >
            <Text style={styles.btnSecondaryText}>⌫</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnRecord, recording && styles.btnDisabled]}
            onPress={handleRecord} disabled={recording}
          >
            <Text style={styles.btnRecordText}>{recording ? "Recording…" : "Record"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnPrimary, !canAdd && styles.btnDisabled]}
            onPress={addWord} disabled={!canAdd}
          >
            <Text style={styles.btnPrimaryText}>Add ✓</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnSecondary, sentence.length === 0 && styles.btnDisabled]}
            onPress={clearSentence} disabled={sentence.length === 0}
          >
            <Text style={styles.btnSecondaryText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: "#fff" },
  permissionContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  permissionText:      { fontSize: 16, textAlign: "center", marginBottom: 16, color: "#374151" },
  permissionButton:    { backgroundColor: "#2196F3", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  permissionButtonText:{ color: "#fff", fontWeight: "600" },
  sentenceBar:         { backgroundColor: "#F9FAFB", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E5E7EB" },
  sentenceScroll:      { paddingHorizontal: 12, paddingVertical: 8, alignItems: "center", minHeight: 44 },
  sentencePlaceholder: { color: "#9CA3AF", fontSize: 14, fontStyle: "italic" },
  wordChip:            { backgroundColor: "#EFF6FF", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6 },
  wordChipText:        { color: "#1D4ED8", fontWeight: "600", fontSize: 14 },
  cameraContainer:     { flex: 1, position: "relative", overflow: "hidden" },
  progressBar:         { position: "absolute", bottom: 0, left: 0, right: 0, height: 4, backgroundColor: "#E5E7EB" },
  progressFill:        { height: 4, backgroundColor: "#2196F3" },
  bottomPanel:         { backgroundColor: "#fff", paddingBottom: 8 },
  errorRow:            { paddingHorizontal: 16, paddingTop: 8 },
  errorText:           { color: "#EF4444", fontSize: 13 },
  predictionRow:       { alignItems: "center", paddingVertical: 12, minHeight: 72 },
  recordingRow:        { flexDirection: "row", alignItems: "center", gap: 8 },
  recordingText:       { color: "#2196F3", fontSize: 14 },
  bigWord:             { fontSize: 36, fontWeight: "700", letterSpacing: 1 },
  confLabel:           { fontSize: 13, color: "#6B7280", marginTop: 2 },
  hintText:            { color: "#9CA3AF", fontSize: 14, fontStyle: "italic" },
  controls:            { flexDirection: "row", paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  btnRecord:           { flex: 2, backgroundColor: "#2196F3", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  btnRecordText:       { color: "#fff", fontWeight: "700", fontSize: 15 },
  btnPrimary:          { flex: 1, backgroundColor: "#10B981", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  btnPrimaryText:      { color: "#fff", fontWeight: "700", fontSize: 15 },
  btnSecondary:        { flex: 1, backgroundColor: "#F3F4F6", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  btnSecondaryText:    { color: "#374151", fontWeight: "600", fontSize: 15 },
  btnDisabled:         { opacity: 0.4 },
});
