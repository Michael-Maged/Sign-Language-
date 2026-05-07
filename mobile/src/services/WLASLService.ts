import { BASE_URL } from "../config";

export interface WLASLPrediction {
  word: string;
  confidence: number;
}

export async function predictWord(frameUris: string[]): Promise<WLASLPrediction> {
  const formData = new FormData();
  frameUris.forEach((uri, i) => {
    formData.append("frames", {
      uri,
      type: "image/jpeg",
      name: `frame_${i}.jpg`,
    } as any);
  });

  const response = await fetch(`${BASE_URL}/wlasl/predict`, {
    method: "POST",
    body: formData,
  });

  if (response.status === 503) throw new Error("WLASL model not ready -- run train_wlasl_model.py first");
  if (response.status === 400) throw new Error("No frames received by server");
  if (!response.ok)            throw new Error("Server error");

  return response.json() as Promise<WLASLPrediction>;
}
