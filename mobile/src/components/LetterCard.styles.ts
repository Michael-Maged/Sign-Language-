import { StyleSheet } from "react-native";
import { P } from "../theme";

export const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  card: {
    width: 110,
    height: 110,
    borderRadius: 14,
    backgroundColor: P.surface2,
    borderWidth: 0.5,
    borderColor: P.borderH,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  placeholderText: {
    fontSize: 28,
    fontWeight: "bold",
    color: P.textMute,
  },
  label: {
    fontSize: 11,
    color: P.textMute,
    marginTop: 5,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
