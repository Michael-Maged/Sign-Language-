import { StyleSheet } from "react-native";
import { P } from "../theme";

export const styles = StyleSheet.create({
  container: {
    backgroundColor: P.surface,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: P.borderH,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 90,
  },
  word: {
    fontSize: 11,
    color: P.textMute,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 8,
    fontWeight: "600",
  },
  letters: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
