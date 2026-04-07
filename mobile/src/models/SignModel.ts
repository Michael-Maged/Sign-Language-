export interface LetterModel {
  letter: string;
  word: string;
}

export interface WordModel {
  word: string;
  letters: LetterModel[];
}

export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
}
