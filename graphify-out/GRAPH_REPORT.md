# Graph Report - C:\Users\Michael Maged\Desktop\Projects\Sign language\Sign-Language-  (2026-04-21)

## Corpus Check
- 27 files · ~36,243,064 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 71 nodes · 55 edges · 24 communities detected
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]

## God Nodes (most connected - your core abstractions)
1. `process()` - 4 edges
2. `normalize()` - 3 edges
3. `_decode_image()` - 3 edges
4. `predict_gesture()` - 3 edges
5. `_angle()` - 3 edges
6. `normalize()` - 3 edges
7. `flip_x()` - 3 edges
8. `handlePress()` - 3 edges
9. `_angle()` - 2 edges
10. `make_detector()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `handlePress()` --calls--> `startRecording()`  [INFERRED]
  C:\Users\Michael Maged\Desktop\Projects\Sign language\Sign-Language-\mobile\src\components\MicButton.tsx → C:\Users\Michael Maged\Desktop\Projects\Sign language\Sign-Language-\mobile\src\services\AudioService.ts
- `handlePress()` --calls--> `stopRecordingAndTranscribe()`  [INFERRED]
  C:\Users\Michael Maged\Desktop\Projects\Sign language\Sign-Language-\mobile\src\components\MicButton.tsx → C:\Users\Michael Maged\Desktop\Projects\Sign language\Sign-Language-\mobile\src\services\AudioService.ts
- `pingServer()` --calls--> `checkServer()`  [INFERRED]
  C:\Users\Michael Maged\Desktop\Projects\Sign language\Sign-Language-\mobile\src\screens\GestureScreen.tsx → C:\Users\Michael Maged\Desktop\Projects\Sign language\Sign-Language-\mobile\src\services\GestureService.ts
- `handleSpeechResult()` --calls--> `textToSign()`  [INFERRED]
  C:\Users\Michael Maged\Desktop\Projects\Sign language\Sign-Language-\mobile\src\screens\HomeScreen.tsx → C:\Users\Michael Maged\Desktop\Projects\Sign language\Sign-Language-\mobile\src\services\ApiService.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.18
Nodes (2): pingServer(), checkServer()

### Community 1 - "Community 1"
Cohesion: 0.33
Nodes (8): _angle(), flip_x(), make_detector(), normalize(), process(), Step 1 - Extract MediaPipe hand landmarks from ASL Alphabet dataset images.  Pro, Angle at b formed by vectors b->a and b->c, in radians., Horizontal-flip augmentation: negate x coordinate of each landmark.

### Community 2 - "Community 2"
Cohesion: 0.36
Nodes (5): _angle(), _decode_image(), normalize(), predict_gesture(), Decode image bytes → RGB numpy array, honouring EXIF rotation.

### Community 3 - "Community 3"
Cohesion: 0.29
Nodes (2): textToSign(), handleSpeechResult()

### Community 4 - "Community 4"
Cohesion: 0.5
Nodes (3): startRecording(), stopRecordingAndTranscribe(), handlePress()

### Community 5 - "Community 5"
Cohesion: 0.67
Nodes (0): 

### Community 6 - "Community 6"
Cohesion: 0.67
Nodes (1): Export one representative landmark set per ASL letter from landmarks.csv.  Reads

### Community 7 - "Community 7"
Cohesion: 0.67
Nodes (1): Picks one representative image per letter from the ASL Alphabet dataset and copi

### Community 8 - "Community 8"
Cohesion: 0.67
Nodes (1): Step 2 — Train XGBoost classifier on extracted landmarks.  Reads:   data/landmar

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (0): 

### Community 10 - "Community 10"
Cohesion: 1.0
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (0): 

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (0): 

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **7 isolated node(s):** `Decode image bytes → RGB numpy array, honouring EXIF rotation.`, `Export one representative landmark set per ASL letter from landmarks.csv.  Reads`, `Step 1 - Extract MediaPipe hand landmarks from ASL Alphabet dataset images.  Pro`, `Angle at b formed by vectors b->a and b->c, in radians.`, `Horizontal-flip augmentation: negate x coordinate of each landmark.` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 9`** (2 nodes): `main.py`, `root()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (2 nodes): `sign.py`, `text_to_sign()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (2 nodes): `speech.py`, `speech_to_text()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (2 nodes): `HandSkeletonView.tsx`, `HandSkeletonView()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (1 nodes): `App.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (1 nodes): `config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (1 nodes): `LetterCard.styles.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (1 nodes): `LetterCard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (1 nodes): `MicButton.styles.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (1 nodes): `WordRow.styles.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (1 nodes): `WordRow.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `SignModel.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (1 nodes): `GestureScreen.styles.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (1 nodes): `HomeScreen.styles.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `Decode image bytes → RGB numpy array, honouring EXIF rotation.`, `Export one representative landmark set per ASL letter from landmarks.csv.  Reads`, `Step 1 - Extract MediaPipe hand landmarks from ASL Alphabet dataset images.  Pro` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._