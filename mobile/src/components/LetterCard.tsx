import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { fetchSignLandmarks } from "../services/ApiService";
import { LandmarkPoint } from "../models/SignModel";
import HandSkeletonView from "./HandSkeletonView";
import { styles } from "./LetterCard.styles";

interface Props {
  letter: string;
}

export default function LetterCard({ letter }: Props) {
  const [landmarks, setLandmarks] = useState<LandmarkPoint[] | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setLandmarks(null);
    fetchSignLandmarks(letter)
      .then((lms) => { if (!cancelled) { setLandmarks(lms); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [letter]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {loading && <ActivityIndicator size="small" color="#60A5FA" />}
        {!loading && error && (
          <Text style={styles.placeholderText}>{letter.toUpperCase()}</Text>
        )}
        {!loading && landmarks && <HandSkeletonView landmarks={landmarks} size={110} />}
      </View>
      <Text style={styles.label}>{letter.toUpperCase()}</Text>
    </View>
  );
}
