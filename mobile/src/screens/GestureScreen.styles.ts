import { StyleSheet } from "react-native";
import { P } from "../theme";

export const styles = StyleSheet.create({

  // ── Root ────────────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  // ── Camera area ──────────────────────────────────────────────────────────────
  cameraContainer: {
    flex: 1,
    overflow: "hidden",
  },
  svgWrapper: {
    ...StyleSheet.absoluteFillObject,
  },

  // ── Top bar ──────────────────────────────────────────────────────────────────
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14,17,23,0.75)",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  flipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(14,17,23,0.75)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  flipIcon: {
    fontSize: 20,
    color: P.text,
  },

  // ── Bottom sheet ─────────────────────────────────────────────────────────────
  bottomPanel: {
    backgroundColor: P.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 0.5,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: P.borderH,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
  },
  grabber: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: P.border,
    alignSelf: "center",
    marginBottom: 14,
  },

  // ── Sentence chips ────────────────────────────────────────────────────────────
  sentenceScroll: {
    paddingHorizontal: 2,
    paddingBottom: 4,
    alignItems: "center",
    minHeight: 40,
    flexGrow: 0,
  },
  sentencePlaceholder: {
    color: P.textMute,
    fontSize: 13,
    fontStyle: "italic",
  },
  letterChip: {
    backgroundColor: P.accentDim,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: "rgba(31,227,240,0.2)",
  },
  letterChipText: {
    color: P.accent,
    fontSize: 18,
    fontWeight: "700",
  },

  // ── Prediction row ────────────────────────────────────────────────────────────
  predictionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    minHeight: 56,
  },
  bigLetter: {
    fontSize: 52,
    fontWeight: "bold",
    width: 56,
  },
  confBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: P.surface2,
    borderRadius: 3,
    overflow: "hidden",
    marginHorizontal: 10,
  },
  confBarFill: {
    height: 6,
    borderRadius: 3,
  },
  confLabel: {
    fontSize: 12,
    color: P.textMute,
    width: 36,
    textAlign: "right",
  },
  hintText: {
    color: P.textMute,
    fontSize: 14,
    fontStyle: "italic",
  },
  errorRow: {
    backgroundColor: "rgba(255,107,122,0.1)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  errorText: {
    color: P.danger,
    fontSize: 13,
    flex: 1,
  },

  // ── Action buttons ────────────────────────────────────────────────────────────
  controls: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  btnPrimary: {
    flex: 2,
    backgroundColor: P.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnPrimaryText: {
    color: P.bg,
    fontSize: 15,
    fontWeight: "700",
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: P.surface2,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: P.borderH,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnSecondaryText: {
    color: P.textDim,
    fontSize: 15,
    fontWeight: "600",
  },
  btnDisabled: {
    opacity: 0.3,
  },

  // ── Server check / unreachable screen ────────────────────────────────────────
  serverCheckContainer: {
    flex: 1,
    backgroundColor: P.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  serverCheckIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  serverCheckTitle: {
    color: P.text,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
    textAlign: "center",
  },
  serverCheckUrl: {
    color: P.accent,
    fontSize: 13,
    fontFamily: "monospace" as any,
    marginBottom: 20,
  },
  serverCheckHint: {
    color: P.textDim,
    fontSize: 13,
    lineHeight: 22,
    textAlign: "left",
    alignSelf: "stretch",
    backgroundColor: P.surface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: P.borderH,
    padding: 14,
    marginBottom: 12,
  },
  serverCheckDetail: {
    color: P.danger,
    fontSize: 12,
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: P.surface2,
    borderWidth: 1,
    borderColor: P.accent,
    paddingHorizontal: 32,
    paddingVertical: 13,
    borderRadius: 12,
  },
  retryButtonText: {
    color: P.accent,
    fontSize: 15,
    fontWeight: "600",
  },

  // ── Permission prompt ─────────────────────────────────────────────────────────
  permissionContainer: {
    flex: 1,
    backgroundColor: P.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  permissionText: {
    color: P.textDim,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: P.accent,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: P.bg,
    fontSize: 15,
    fontWeight: "700",
  },
});
