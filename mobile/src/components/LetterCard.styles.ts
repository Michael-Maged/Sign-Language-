import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginHorizontal: 4,
  },
  imageContainer: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 64,
    height: 64,
  },
  hidden: {
    opacity: 0,
    position: "absolute",
  },
  loader: {
    position: "absolute",
  },
  placeholder: {
    width: 64,
    height: 64,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#bbb",
  },
  label: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
});
