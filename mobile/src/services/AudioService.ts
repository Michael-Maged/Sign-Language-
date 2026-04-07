import { Audio } from "expo-av";
import { BASE_URL } from "../config";

let recording: Audio.Recording | null = null;

export async function startRecording(): Promise<void> {
  await Audio.requestPermissionsAsync();
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });
  recording = new Audio.Recording();
  await recording.prepareToRecordAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );
  await recording.startAsync();
}

export async function stopRecordingAndTranscribe(): Promise<string> {
  if (!recording) throw new Error("No active recording");
  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();
  recording = null;

  if (!uri) throw new Error("Recording URI is null");

  const formData = new FormData();
  formData.append("file", { uri, type: "audio/m4a", name: "recording.m4a" } as any);

  const response = await fetch(`${BASE_URL}/speech-to-text`, {
    method: "POST",
    body: formData,
  });
  const data = await response.json();
  return data.text as string;
}
