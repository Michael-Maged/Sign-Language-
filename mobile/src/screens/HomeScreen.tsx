import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import MicButton from "../components/MicButton";
import WordRow from "../components/WordRow";
import { textToSign } from "../services/ApiService";
import { WordModel } from "../models/SignModel";
import { P } from "../theme";

type MicState = "idle" | "recording" | "processing";
type ScreenState = MicState | "result";

function PulseRing({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1, duration: 1800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const scale   = anim.interpolate({ inputRange: [0, 1], outputRange: [1,   1.6] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.65, 0 ] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: 176, height: 176, borderRadius: 88,
        borderWidth: 1.5, borderColor: P.accent,
        transform: [{ scale }],
        opacity,
      }}
    />
  );
}

export default function HomeScreen() {
  const [micState,   setMicState]   = useState<MicState>("idle");
  const [transcript, setTranscript] = useState("");
  const [words,      setWords]      = useState<WordModel[]>([]);

  const screenState: ScreenState = words.length > 0 ? "result" : micState;

  const statusLabel: Record<ScreenState, string> = {
    idle:       "Tap to speak",
    recording:  "Listening…",
    processing: "Transcribing…",
    result:     "Tap a word to replay",
  };

  async function handleSpeechResult(text: string) {
    setTranscript(text);
    try {
      const result = await textToSign(text);
      setWords(result);
    } catch {
      /* keep transcript, just no signs */
    }
  }

  function handleError(msg: string) {
    setTranscript(msg);
  }

  function handleStateChange(s: MicState) {
    setMicState(s);
    if (s === "recording") {
      setTranscript("");
      setWords([]);
    }
  }

  const isRecording = micState === "recording";

  return (
    <View style={{ flex: 1, backgroundColor: P.bg }}>
      {/* Header */}
      <SafeAreaView edges={["top"]} style={{ paddingTop: 4 }}>
        <View style={{
          flexDirection: "row", alignItems: "center", gap: 10,
          paddingHorizontal: 20, paddingBottom: 14,
        }}>
          <View style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: P.accentDim,
            alignItems: "center", justifyContent: "center",
          }}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"
              stroke={P.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M7 11V5.5a1.5 1.5 0 1 1 3 0V11" />
              <Path d="M10 10V4a1.5 1.5 0 1 1 3 0v7" />
              <Path d="M13 10.5V5.5a1.5 1.5 0 1 1 3 0V13" />
              <Path d="M16 10v-1a1.5 1.5 0 1 1 3 0v6.5a6 6 0 0 1-6 6h-1.5a5 5 0 0 1-4.5-2.8L4 13a1.6 1.6 0 0 1 2.8-1.6L7 11.5" />
            </Svg>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: P.text, letterSpacing: 0.2 }}>
              Sign Language
            </Text>
            <Text style={{ fontSize: 10, color: P.textMute, letterSpacing: 1.2, marginTop: 1 }}>
              SPEAK · SIGN · CONNECT
            </Text>
          </View>
          <View style={{
            backgroundColor: P.surface2, borderRadius: 6,
            borderWidth: 1, borderColor: P.borderH,
            paddingHorizontal: 8, paddingVertical: 3,
          }}>
            <Text style={{ fontSize: 11, color: P.textDim, fontWeight: "600", letterSpacing: 0.5 }}>
              EN-US
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Mic + pulse area */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View style={{ alignItems: "center", justifyContent: "center", width: 300, height: 280 }}>
          {isRecording ? (
            <>
              <PulseRing delay={0} />
              <PulseRing delay={600} />
              <PulseRing delay={1200} />
            </>
          ) : (
            <View pointerEvents="none" style={{
              position: "absolute",
              width: 176, height: 176, borderRadius: 88,
              borderWidth: 1, borderColor: P.borderH,
            }} />
          )}
          <MicButton
            onResult={handleSpeechResult}
            onError={handleError}
            onStateChange={handleStateChange}
          />
        </View>

        <Text style={{
          fontSize: 15, marginTop: -12,
          color: isRecording ? P.accent : P.textDim,
          letterSpacing: 0.3,
        }}>
          {statusLabel[screenState]}
        </Text>
      </View>

      {/* Results */}
      {(!!transcript || words.length > 0) && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          {/* Transcript card */}
          {!!transcript && (
            <View style={{
              backgroundColor: P.surface, borderRadius: 16,
              borderWidth: 0.5, borderColor: P.borderH,
              padding: 14, marginBottom: 12,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                  stroke={P.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                </Svg>
                <Text style={{ fontSize: 10, fontWeight: "700", color: P.textMute, letterSpacing: 1.5 }}>
                  TRANSCRIPT
                </Text>
              </View>
              <Text style={{ fontSize: 15, color: P.textDim, lineHeight: 22 }}>
                "{transcript}"
              </Text>
            </View>
          )}

          {/* Sign sequence */}
          {words.length > 0 && (
            <>
              <View style={{
                flexDirection: "row", alignItems: "center",
                justifyContent: "space-between", marginBottom: 8,
              }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: P.text }}>Sign sequence</Text>
                <Text style={{ fontSize: 12, color: P.textMute }}>
                  {words.length} {words.length === 1 ? "word" : "words"}
                </Text>
              </View>
              <FlatList
                data={words}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, i) => `${item.word}-${i}`}
                renderItem={({ item }) => <WordRow item={item} />}
                contentContainerStyle={{ gap: 10 }}
              />
            </>
          )}
        </View>
      )}
    </View>
  );
}
