import { BASE_URL } from "../config";
import { WordModel, LandmarkPoint } from "../models/SignModel";

export async function textToSign(text: string): Promise<WordModel[]> {
  const response = await fetch(
    `${BASE_URL}/text-to-sign?text=${encodeURIComponent(text)}`,
    { method: "POST" }
  );
  const data = await response.json();
  return data.words as WordModel[];
}

export async function fetchSignLandmarks(letter: string): Promise<LandmarkPoint[]> {
  const response = await fetch(`${BASE_URL}/signs/${letter.toLowerCase()}/landmarks`);
  if (!response.ok) throw new Error(`No landmarks for '${letter}'`);
  const data = await response.json();
  return data.landmarks as LandmarkPoint[];
}
