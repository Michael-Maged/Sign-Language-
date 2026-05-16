import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { BASE_URL } from "../config";
import { GesturePrediction, RawLandmark, predictGesture, checkServer } from "../services/GestureService";
import { styles } from "./GestureScreen.styles";
import { P } from "../theme";

// ── Hand skeleton ───────────────────────────────────────────────────────────
const BONES: [number, number][] = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20],
  [0,17],
];
const BONE_COLORS = [
  "#FB923C","#FB923C","#FB923C","#FB923C",
  "#4ADE80","#4ADE80","#4ADE80","#4ADE80",
  "#94A3B8","#60A5FA","#60A5FA","#60A5FA",
  "#94A3B8","#FACC15","#FACC15","#FACC15",
  "#94A3B8","#C084FC","#C084FC","#C084FC",
  "#94A3B8",
];
const JOINT_COLORS = [
  "#94A3B8",
  "#FB923C","#FB923C","#FB923C","#FB923C",
  "#4ADE80","#4ADE80","#4ADE80","#4ADE80",
  "#60A5FA","#60A5FA","#60A5FA","#60A5FA",
  "#FACC15","#FACC15","#FACC15","#FACC15",
  "#C084FC","#C084FC","#C084FC","#C084FC",
];

const AUTO_INTERVAL_MS = 2500;
const MIN_CONFIDENCE   = 0.6;

function toScreen(lm: RawLandmark, cw: number, ch: number, iw: number, ih: number) {
  if (iw === 0 || ih === 0) return { x: lm.x * cw, y: lm.y * ch };
  const scale = Math.max(cw / iw, ch / ih);
  return {
    x: lm.x * iw * scale + (cw - iw * scale) / 2,
    y: lm.y * ih * scale + (ch - ih * scale) / 2,
  };
}

// ── Component ───────────────────────────────────────────────────────────────
export default function GestureScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing]             = useState<"front" | "back">("back");

  const [serverStatus, setServerStatus] = useState<"checking" | "ok" | "unreachable">("checking");
  const [serverError, setServerError]   = useState("");

  const [scanning, setScanning]         = useState(false);
  const [prediction, setPrediction]     = useState<GesturePrediction | null>(null);
  const [scanError, setScanError]       = useState("");
  const [lms, setLms]                   = useState<RawLandmark[]>([]);
  const [container, setContainer]       = useState({ w: 0, h: 0 });
  const [imgSize, setImgSize]           = useState({ w: 0, h: 0 });

  const [sentence, setSentence]         = useState<string[]>([]);

  const cameraRef    = useRef<CameraView>(null);
  const busyRef      = useRef(false);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const sentenceRef  = useRef<ScrollView>(null);
  // Temporal smoothing: require the same letter in 2 of the last 3 frames
  const recentRef    = useRef<string[]>([]);

  // ── Server check ─────────────────────────────────────────────────────────
  async function pingServer() {
    setServerStatus("checking");
    setServerError("");
    try {
      await checkServer();
      setServerStatus("ok");
    } catch (e: any) {
      setServerStatus("unreachable");
      setServerError(e?.message?.includes("Abort") ? "Timed out (4s)" : e.message ?? "Network error");
    }
  }

  useEffect(() => { pingServer(); }, []);

  // ── Auto-scan loop ────────────────────────────────────────────────────────
  const capture = useCallback(async () => {
    if (busyRef.current || !cameraRef.current) return;
    busyRef.current = true;
    setScanning(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo) throw new Error("Capture returned null");
      setImgSize({ w: photo.width, h: photo.height });
      const result = await predictGesture(photo.uri);
      const letter = result.letter.toLowerCase();

      if (letter === "nothing") {
        recentRef.current = [];
        setPrediction(null);
        setLms([]);
      } else {
        // Temporal smoothing: keep last 3 results; commit only when ≥2 agree
        const recent = [...recentRef.current.slice(-2), result.letter];
        recentRef.current = recent;
        const counts: Record<string, number> = {};
        recent.forEach((l) => { counts[l] = (counts[l] ?? 0) + 1; });
        const stable = Object.entries(counts).find(([, n]) => n >= 2)?.[0];
        if (stable && stable === result.letter) {
          setPrediction(result);
          setLms(result.landmarks);
        }
        // Always update skeleton even while unstable (visual feedback)
        else {
          setLms(result.landmarks);
        }
      }
      setScanError("");
    } catch (e: any) {
      const msg = e.message ?? "Unknown error";
      if (msg.toLowerCase().includes("no hand")) {
        setPrediction(null);
        setLms([]);
        setScanError("");
      } else {
        setScanError(msg);
      }
    } finally {
      busyRef.current = false;
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    if (serverStatus !== "ok") return;
    const start = setTimeout(() => {
      capture();
      intervalRef.current = setInterval(capture, AUTO_INTERVAL_MS);
    }, 800);
    return () => {
      clearTimeout(start);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [serverStatus, capture]);

  // ── Sentence helpers ──────────────────────────────────────────────────────
  function addLetter() {
    if (!prediction || prediction.confidence < MIN_CONFIDENCE) return;
    setSentence((prev) => {
      const next = [...prev, prediction.letter];
      setTimeout(() => sentenceRef.current?.scrollToEnd({ animated: true }), 50);
      return next;
    });
  }
  function deleteLetter()  { setSentence((s) => s.slice(0, -1)); }
  function clearSentence() { setSentence([]); }

  function handleFlip() {
    setFacing((f) => (f === "back" ? "front" : "back"));
    setPrediction(null);
    setScanError("");
    recentRef.current = [];
  }
  function handleLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setContainer({ w: width, h: height });
  }

  // ── Permission gate ───────────────────────────────────────────────────────
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

  // ── Server states ─────────────────────────────────────────────────────────
  if (serverStatus === "checking") {
    return (
      <View style={styles.serverCheckContainer}>
        <Text style={[styles.serverCheckTitle, { color: P.textMute, fontSize: 15, marginBottom: 16 }]}>
          Connecting to backend…
        </Text>
        <Text style={styles.serverCheckUrl}>{BASE_URL}</Text>
      </View>
    );
  }

  if (serverStatus === "unreachable") {
    return (
      <View style={styles.serverCheckContainer}>
        <View style={{
          width: 64, height: 64, borderRadius: 32,
          backgroundColor: "rgba(255,107,122,0.12)",
          alignItems: "center", justifyContent: "center",
          marginBottom: 20,
        }}>
          <Svg width={32} height={32} viewBox="0 0 24 24" fill="none"
            stroke={P.danger} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M1 6c3.5-3.5 8.5-4.5 13-3M5 10c2-2 5-3.5 8.5-3M9 14c.67-.67 1.67-1 2.5-1" />
            <Path d="m2 2 20 20" />
            <Path d="M14.5 14.5 17 17" />
          </Svg>
        </View>
        <Text style={styles.serverCheckTitle}>Cannot reach backend</Text>
        <Text style={styles.serverCheckUrl}>{BASE_URL}</Text>
        <View style={styles.serverCheckHint}>
          <Text style={{ color: P.textDim, fontSize: 13, lineHeight: 22 }}>
            {"• Backend running?  uvicorn main:app\n• Phone + PC on same Wi-Fi?\n• IP in config.ts matches ipconfig?"}
          </Text>
        </View>
        {!!serverError && (
          <Text style={styles.serverCheckDetail}>{serverError}</Text>
        )}
        <TouchableOpacity style={styles.retryButton} onPress={pingServer}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const pts = lms.map((lm) =>
    toScreen(
      facing === "front" ? { x: 1 - lm.x, y: lm.y } : lm,
      container.w, container.h, imgSize.w, imgSize.h,
    )
  );

  const confColor =
    !prediction                  ? P.textMute :
    prediction.confidence >= 0.8 ? P.ok :
    prediction.confidence >= 0.6 ? P.warn : P.danger;

  const canAdd = !!prediction && prediction.confidence >= MIN_CONFIDENCE
    && prediction.letter.toLowerCase() !== "nothing";

  const badgeLabel = scanning ? "Scanning…" : prediction ? "Hand detected" : "No hand";
  const badgeColor = scanning ? "#60A5FA"   : prediction ? P.ok           : P.danger;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* Camera + skeleton */}
      <TouchableOpacity
        activeOpacity={1}
        style={styles.cameraContainer}
        onLayout={handleLayout}
        onPress={capture}
      >
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          facing={facing}
        />

        {pts.length === 21 && container.w > 0 && (
          <View style={styles.svgWrapper} pointerEvents="none">
            <Svg width={container.w} height={container.h}>
              {BONES.map(([a, b], i) => (
                <Line key={i}
                  x1={pts[a].x} y1={pts[a].y} x2={pts[b].x} y2={pts[b].y}
                  stroke={BONE_COLORS[i]} strokeWidth={2.5} strokeLinecap="round" opacity={0.85}
                />
              ))}
              {pts.map((p, i) => (
                <Circle key={i} cx={p.x} cy={p.y} r={i === 0 ? 6 : 4}
                  fill={JOINT_COLORS[i]} opacity={0.95}
                />
              ))}
            </Svg>
          </View>
        )}

        {/* Top bar */}
        <SafeAreaView edges={["top"]} style={styles.topBar} pointerEvents="box-none">
          <View style={[styles.statusBadge, { borderColor: badgeColor }]}>
            <View style={[styles.statusDot, { backgroundColor: badgeColor }]} />
            <Text style={[styles.statusLabel, { color: badgeColor }]}>{badgeLabel}</Text>
          </View>
          <TouchableOpacity style={styles.flipButton} onPress={handleFlip}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
              stroke={P.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <Path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <Path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <Path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <Path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <Path d="M9 9h.01M15 9h.01" />
            </Svg>
          </TouchableOpacity>
        </SafeAreaView>
      </TouchableOpacity>

      {/* Bottom sheet */}
      <View style={styles.bottomPanel}>
        <View style={styles.grabber} />

        {/* Sentence chips */}
        <ScrollView
          ref={sentenceRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sentenceScroll}
          style={{ marginBottom: 4, maxHeight: 48 }}
        >
          {sentence.length === 0
            ? <Text style={styles.sentencePlaceholder}>Sign a letter → tap Add</Text>
            : sentence.map((l, i) => (
                <View key={i} style={styles.letterChip}>
                  <Text style={styles.letterChipText}>{l}</Text>
                </View>
              ))
          }
        </ScrollView>

        {/* Scan error */}
        {!!scanError && (
          <View style={styles.errorRow}>
            <Text style={styles.errorText}>⚠ {scanError}</Text>
          </View>
        )}

        {/* Prediction */}
        <View style={styles.predictionRow}>
          {prediction ? (
            <>
              <Text style={[styles.bigLetter, { color: confColor }]}>{prediction.letter}</Text>
              <View style={styles.confBarTrack}>
                <View style={[styles.confBarFill,
                  { width: `${Math.round(prediction.confidence * 100)}%` as any, backgroundColor: confColor }
                ]} />
              </View>
              <Text style={styles.confLabel}>{Math.round(prediction.confidence * 100)}%</Text>
            </>
          ) : !scanError ? (
            <Text style={styles.hintText}>Show your hand sign to the camera</Text>
          ) : null}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.btnSecondary, sentence.length === 0 && styles.btnDisabled]}
            onPress={deleteLetter} disabled={sentence.length === 0}
          >
            <Text style={styles.btnSecondaryText}>⌫</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnPrimary, !canAdd && styles.btnDisabled]}
            onPress={addLetter} disabled={!canAdd}
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
