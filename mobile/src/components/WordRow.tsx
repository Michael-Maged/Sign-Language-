import React from "react";
import { View, Text, ScrollView } from "react-native";
import LetterCard from "./LetterCard";
import { WordModel } from "../models/SignModel";
import { styles } from "./WordRow.styles";

interface Props {
  item: WordModel;
}

export default function WordRow({ item }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.word}>{item.word}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.letters}>
        {item.letters.map((l, i) => (
          <LetterCard key={`${l.letter}-${i}`} letter={l.letter} />
        ))}
      </ScrollView>
    </View>
  );
}
