import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";
import HomeScreen    from "./src/screens/HomeScreen";
import GestureScreen from "./src/screens/GestureScreen";
import WLASLScreen   from "./src/screens/WLASLScreen";
import { P } from "./src/theme";

type Tab = "speech" | "gesture" | "wlasl";

export default function App() {
  const [tab, setTab] = useState<Tab>("speech");

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={styles.root}>
        <View style={styles.content}>
          {tab === "speech"  && <HomeScreen />}
          {tab === "gesture" && <GestureScreen />}
          {tab === "wlasl"   && <WLASLScreen />}
        </View>
        <SafeAreaView edges={["bottom"]} style={styles.tabBarWrap}>
          <View style={styles.tabBar}>
            <TabItem label="Speech"  active={tab === "speech"}  onPress={() => setTab("speech")}>
              <MicIcon active={tab === "speech"} />
            </TabItem>
            <TabItem label="Letters" active={tab === "gesture"} onPress={() => setTab("gesture")}>
              <HandIcon active={tab === "gesture"} />
            </TabItem>
            <TabItem label="Words"   active={tab === "wlasl"}   onPress={() => setTab("wlasl")}>
              <BookIcon active={tab === "wlasl"} />
            </TabItem>
          </View>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

function TabItem({
  label, active, onPress, children,
}: {
  label: string; active: boolean; onPress: () => void; children: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
      {active && <View style={styles.tabIndicator} />}
      <View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}>
        {children}
      </View>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function MicIcon({ active }: { active: boolean }) {
  const c = active ? P.accent : P.textMute;
  const w = active ? 2 : 1.7;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="9" y="2.5" width="6" height="12" rx="3" />
      <Path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
      <Path d="M12 18v3.5" />
    </Svg>
  );
}

function HandIcon({ active }: { active: boolean }) {
  const c = active ? P.accent : P.textMute;
  const w = active ? 2 : 1.7;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M7 11V5.5a1.5 1.5 0 1 1 3 0V11" />
      <Path d="M10 10V4a1.5 1.5 0 1 1 3 0v7" />
      <Path d="M13 10.5V5.5a1.5 1.5 0 1 1 3 0V13" />
      <Path d="M16 10v-1a1.5 1.5 0 1 1 3 0v6.5a6 6 0 0 1-6 6h-1.5a5 5 0 0 1-4.5-2.8L4 13a1.6 1.6 0 0 1 2.8-1.6L7 11.5" />
    </Svg>
  );
}

function BookIcon({ active }: { active: boolean }) {
  const c = active ? P.accent : P.textMute;
  const w = active ? 2 : 1.7;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H11v17H5.5A1.5 1.5 0 0 1 4 18.5v-14z" />
      <Path d="M20 4.5A1.5 1.5 0 0 0 18.5 3H13v17h5.5a1.5 1.5 0 0 0 1.5-1.5v-14z" />
      <Path d="M7 7.5h1.5M7 10.5h1.5M15.5 7.5H17M15.5 10.5H17" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root:              { flex: 1, backgroundColor: P.bg },
  content:           { flex: 1 },
  tabBarWrap:        { backgroundColor: P.bg, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 },
  tabBar:            {
    flexDirection: "row",
    backgroundColor: P.surface,
    borderRadius: 22,
    padding: 8,
    gap: 4,
    borderWidth: 0.5,
    borderColor: P.borderH,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 8,
  },
  tabItem:           { flex: 1, alignItems: "center", paddingVertical: 7, borderRadius: 16, position: "relative" },
  tabIndicator:      { position: "absolute", top: 4, width: 18, height: 2, borderRadius: 2, backgroundColor: P.accent },
  tabIconWrap:       { marginTop: 4 },
  tabIconWrapActive: { },
  tabLabel:          { fontSize: 11, color: P.textMute, marginTop: 3, fontWeight: "500", letterSpacing: 0.1 },
  tabLabelActive:    { color: P.accent, fontWeight: "600" },
});
