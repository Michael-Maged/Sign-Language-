import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  title: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 12,
  },
  statusText: {
    fontSize: 18,
    textAlign: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#333",
  },
  divider: { height: 1, backgroundColor: "#e0e0e0", marginVertical: 4 },
  loader: { flex: 1 },
  emptyText: { flex: 1, textAlign: "center", marginTop: 40, color: "#999" },
  signItem: { alignItems: "center", paddingVertical: 12 },
  signWord: { fontSize: 16, fontWeight: "500", marginBottom: 8 },
  signImage: { width: 160, height: 120 },
  micContainer: { alignItems: "center", paddingVertical: 20 },
});
