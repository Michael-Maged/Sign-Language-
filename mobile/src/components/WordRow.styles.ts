import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  word: {
    fontSize: 13,
    color: "#999",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  letters: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 4,
  },
});
