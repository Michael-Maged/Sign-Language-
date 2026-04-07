import { BASE_URL } from "../config";

export interface RawLandmark {
  x: number; // 0–1 fraction of image width
  y: number; // 0–1 fraction of image height
}

export interface GesturePrediction {
  letter: string;
  confidence: number;
  landmarks: RawLandmark[];
}

export async function checkServer(): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`${BASE_URL}/`, { signal: controller.signal });
    if (!res.ok) throw new Error(`Server responded with ${res.status}`);
  } finally {
    clearTimeout(timeout);
  }
}

export async function predictGesture(imageUri: string): Promise<GesturePrediction> {
  const formData = new FormData();
  formData.append("file", { uri: imageUri, type: "image/jpeg", name: "gesture.jpg" } as any);

  const response = await fetch(`${BASE_URL}/gesture/predict`, {
    method: "POST",
    body: formData,
  });

  if (response.status === 422) throw new Error("No hand detected — try again");
  if (response.status === 503) throw new Error("Model not ready — run train_model.py first");
  if (!response.ok)            throw new Error("Server error");

  return response.json() as Promise<GesturePrediction>;
}
