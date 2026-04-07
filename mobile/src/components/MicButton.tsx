import React, { useState } from "react";
import { TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { styles } from "./MicButton.styles";
import { startRecording, stopRecordingAndTranscribe } from "../services/AudioService";

interface Props {
  onResult: (text: string) => void;
  onError: (msg: string) => void;
}

export default function MicButton({ onResult, onError }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  async function handlePress() {
    if (isProcessing) return;

    if (!isRecording) {
      try {
        await startRecording();
        setIsRecording(true);
      } catch {
        onError("Could not start recording");
      }
    } else {
      setIsRecording(false);
      setIsProcessing(true);
      try {
        const text = await stopRecordingAndTranscribe();
        onResult(text);
      } catch {
        onError("Could not reach server — is the backend running?");
      } finally {
        setIsProcessing(false);
      }
    }
  }

  return (
    <TouchableOpacity
      style={[styles.button, isRecording && styles.recording]}
      onPress={handlePress}
      disabled={isProcessing}
    >
      {isProcessing ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.icon}>{isRecording ? "⏹" : "🎙"}</Text>
      )}
    </TouchableOpacity>
  );
}

