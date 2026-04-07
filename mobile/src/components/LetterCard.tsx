import React, { useState } from "react";
import { View, Text, Image, ActivityIndicator } from "react-native";
import { BASE_URL } from "../config";
import { styles } from "./LetterCard.styles";

interface Props {
  letter: string;
}

export default function LetterCard({ letter }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const uri = `${BASE_URL}/signs/${letter.toLowerCase()}`;

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>{letter.toUpperCase()}</Text>
        </View>
      ) : (
        <View style={styles.imageContainer}>
          {loading && <ActivityIndicator style={styles.loader} size="small" color="#2196F3" />}
          <Image
            source={{ uri }}
            style={[styles.image, loading && styles.hidden]}
            resizeMode="contain"
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
          />
        </View>
      )}
      <Text style={styles.label}>{letter.toUpperCase()}</Text>
    </View>
  );
}
