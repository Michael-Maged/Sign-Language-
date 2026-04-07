import React, { useState } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MicButton from "../components/MicButton";
import WordRow from "../components/WordRow";
import { textToSign } from "../services/ApiService";
import { WordModel } from "../models/SignModel";
import { styles } from "./HomeScreen.styles";

export default function HomeScreen() {
  const [status, setStatus] = useState("Tap the mic and speak");
  const [words, setWords] = useState<WordModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSpeechResult(text: string) {
    setStatus(text);
    setIsLoading(true);
    setWords([]);
    try {
      const result = await textToSign(text);
      setWords(result);
    } catch {
      setStatus("Error: could not reach server");
    } finally {
      setIsLoading(false);
    }
  }

  function handleError(msg: string) {
    setStatus(msg);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Text style={styles.title}>Sign Translator</Text>

      <Text style={styles.statusText}>{status}</Text>

      <View style={styles.divider} />

      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#2196F3" />
      ) : words.length === 0 ? (
        <Text style={styles.emptyText}>No signs yet</Text>
      ) : (
        <FlatList
          data={words}
          keyExtractor={(item, index) => `${item.word}-${index}`}
          renderItem={({ item }) => <WordRow item={item} />}
        />
      )}

      <View style={styles.micContainer}>
        <MicButton onResult={handleSpeechResult} onError={handleError} />
      </View>
    </SafeAreaView>
  );
}
