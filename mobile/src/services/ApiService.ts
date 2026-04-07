import { BASE_URL } from "../config";
import { WordModel } from "../models/SignModel";

export async function textToSign(text: string): Promise<WordModel[]> {
  const response = await fetch(
    `${BASE_URL}/text-to-sign?text=${encodeURIComponent(text)}`,
    { method: "POST" }
  );
  const data = await response.json();
  return data.words as WordModel[];
}
