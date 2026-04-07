import React, { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";
import { LandmarkPoint } from "../models/SignModel";

interface Props {
  landmarks: LandmarkPoint[];
  size?: number;
}

// MediaPipe hand bone connections with finger-specific colours
const CONNECTIONS: { from: number; to: number; color: string }[] = [
  // Palm
  { from: 0, to: 1,  color: "#FB923C" },
  { from: 0, to: 5,  color: "#4ADE80" },
  { from: 0, to: 17, color: "#C084FC" },
  { from: 5, to: 9,  color: "#94A3B8" },
  { from: 9, to: 13, color: "#94A3B8" },
  { from: 13, to: 17, color: "#94A3B8" },
  // Thumb
  { from: 1, to: 2,  color: "#FB923C" },
  { from: 2, to: 3,  color: "#FB923C" },
  { from: 3, to: 4,  color: "#FB923C" },
  // Index
  { from: 5, to: 6,  color: "#4ADE80" },
  { from: 6, to: 7,  color: "#4ADE80" },
  { from: 7, to: 8,  color: "#4ADE80" },
  // Middle
  { from: 9,  to: 10, color: "#60A5FA" },
  { from: 10, to: 11, color: "#60A5FA" },
  { from: 11, to: 12, color: "#60A5FA" },
  // Ring
  { from: 13, to: 14, color: "#FACC15" },
  { from: 14, to: 15, color: "#FACC15" },
  { from: 15, to: 16, color: "#FACC15" },
  // Pinky
  { from: 17, to: 18, color: "#C084FC" },
  { from: 18, to: 19, color: "#C084FC" },
  { from: 19, to: 20, color: "#C084FC" },
];

const JOINT_COLORS = [
  "#94A3B8",                                              // 0  wrist
  "#FB923C","#FB923C","#FB923C","#FB923C",               // 1-4  thumb
  "#4ADE80","#4ADE80","#4ADE80","#4ADE80",               // 5-8  index
  "#60A5FA","#60A5FA","#60A5FA","#60A5FA",               // 9-12 middle
  "#FACC15","#FACC15","#FACC15","#FACC15",               // 13-16 ring
  "#C084FC","#C084FC","#C084FC","#C084FC",               // 17-20 pinky
];

export default function HandSkeletonView({ landmarks, size = 110 }: Props) {
  const centerX = size / 2;
  const wristY  = size * 0.86;
  const scale   = size * 0.47;

  const animRef = useRef(new Animated.Value(0));
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    animRef.current.setValue(0);
    setProgress(0);
    const id = animRef.current.addListener(({ value }) => setProgress(value));
    Animated.spring(animRef.current, {
      toValue: 1,
      tension: 55,
      friction: 7,
      useNativeDriver: false,
    }).start();
    return () => animRef.current.removeListener(id);
  }, [landmarks]);

  const pos = landmarks.map((lm) => ({
    x: centerX + lm.x * scale * progress,
    y: wristY  + lm.y * scale * progress,
  }));

  return (
    <Svg width={size} height={size}>
      {CONNECTIONS.map(({ from, to, color }, i) => (
        <Line
          key={i}
          x1={pos[from].x}
          y1={pos[from].y}
          x2={pos[to].x}
          y2={pos[to].y}
          stroke={color}
          strokeWidth={2.2}
          strokeLinecap="round"
          opacity={0.85}
        />
      ))}
      {pos.map((p, i) => (
        <Circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === 0 ? 4 : 2.8}
          fill={JOINT_COLORS[i]}
          opacity={0.95}
        />
      ))}
    </Svg>
  );
}
