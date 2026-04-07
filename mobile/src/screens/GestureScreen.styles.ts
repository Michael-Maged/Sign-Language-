import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({

  // ── Root ────────────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  // ── Sentence strip ───────────────────────────────────────────────────────────
  sentenceBar: {
    backgroundColor: "rgba(13,27,42,0.97)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1E3A5F",
  },
  sentenceScroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 54,
    alignItems: "center",
  },
  sentencePlaceholder: {
    color: "#475569",
    fontSize: 13,
    fontStyle: "italic",
  },
  letterChip: {
    backgroundColor: "#1E3A5F",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginHorizontal: 3,
  },
  letterChipText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },

  // ── Camera area ──────────────────────────────────────────────────────────────
  cameraContainer: {
    flex: 1,
    overflow: "hidden",
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  svgWrapper: {
    ...StyleSheet.absoluteFillObject,
  },

  // Pulsing detection ring — centered via absolute + negative margins
  pulseRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: "#60A5FA",
    alignSelf: "center",
    top: "50%" as any,
    marginTop: -70,
  },

  // Top bar — status badge (left) + flip button (right)
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
    backgroundColor: "rgba(0,0,0,0.6)",
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  flipIcon: {
    fontSize: 22,
    color: "#fff",
  },

  // Tap-to-scan hint overlay
  tapHint: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tapHintText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },

  // ── Bottom panel ─────────────────────────────────────────────────────────────
  bottomPanel: {
    backgroundColor: "rgba(13,27,42,0.97)",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#1E3A5F",
  },

  errorRow: {
    backgroundColor: "rgba(248,113,113,0.1)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  predictionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    minHeight: 56,
  },
  bigLetter: {
    fontSize: 52,
    fontWeight: "bold",
    width: 56,
  },
  confBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 4,
    overflow: "hidden",
    marginHorizontal: 10,
  },
  confBarFill: {
    height: 8,
    borderRadius: 4,
  },
  confLabel: {
    fontSize: 12,
    color: "#94A3B8",
    width: 36,
    textAlign: "right",
  },
  hintText: {
    color: "#475569",
    fontSize: 14,
  },
  errorText: {
    color: "#F87171",
    fontSize: 13,
    flex: 1,
  },

  // ── Action buttons ───────────────────────────────────────────────────────────
  controls: {
    flexDirection: "row",
    gap: 8,
  },
  btnPrimary: {
    flex: 2,
    backgroundColor: "#2196F3",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnPrimaryText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnSecondaryText: {
    color: "#94A3B8",
    fontSize: 15,
  },
  btnDisabled: {
    opacity: 0.3,
  },

  // ── Server check / unreachable screen ───────────────────────────────────────
  serverCheckContainer: {
    flex: 1,
    backgroundColor: "#0D1B2A",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  serverCheckIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  serverCheckTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
    textAlign: "center",
  },
  serverCheckUrl: {
    color: "#60A5FA",
    fontSize: 13,
    fontFamily: "monospace" as any,
    marginBottom: 20,
  },
  serverCheckHint: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 22,
    textAlign: "left",
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  serverCheckDetail: {
    color: "#F87171",
    fontSize: 12,
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 32,
    paddingVertical: 13,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  // ── Permission prompt ────────────────────────────────────────────────────────
  permissionContainer: {
    flex: 1,
    backgroundColor: "#0D1B2A",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  permissionText: {
    color: "#94A3B8",
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
