import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import HomeScreen from "./src/screens/HomeScreen";
import GestureScreen from "./src/screens/GestureScreen";

type Tab = "speech" | "gesture";

export default function App() {
  const [tab, setTab] = useState<Tab>("speech");

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <View style={styles.root}>
        <View style={styles.content}>
          {tab === "speech" ? <HomeScreen /> : <GestureScreen />}
        </View>
        <SafeAreaView edges={["bottom"]} style={styles.tabBar}>
          <TabItem icon="🎙" label="Speech"  active={tab === "speech"}  onPress={() => setTab("speech")} />
          <TabItem icon="✋" label="Camera"  active={tab === "gesture"} onPress={() => setTab("gesture")} />
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

function TabItem({
  icon, label, active, onPress,
}: {
  icon: string; label: string; active: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress}>
      {active && <View style={styles.tabIndicator} />}
      <Text style={styles.tabIcon}>{icon}</Text>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#D1D5DB",
    backgroundColor: "#fff",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  tabIndicator: {
    position: "absolute",
    top: 0,
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#2196F3",
  },
  tabIcon: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  tabLabelActive: {
    color: "#2196F3",
    fontWeight: "600",
  },
});
