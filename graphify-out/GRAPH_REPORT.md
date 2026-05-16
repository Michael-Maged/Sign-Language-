# Graph Report - C:\Users\Michael Maged\Desktop\Projects\Sign language\Sign-Language-  (2026-05-08)

## Corpus Check
- 35 files · ~36,271,800 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 119 nodes · 113 edges · 30 communities detected
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]

## God Nodes (most connected - your core abstractions)
1. `normalize()` - 5 edges
2. `flip_x()` - 5 edges
3. `_pad_or_trim()` - 5 edges
4. `predict_word()` - 4 edges
5. `process()` - 4 edges
6. `_video_to_sequence()` - 4 edges
7. `_make_landmarks()` - 4 edges
8. `test_normalize_wrist_at_origin()` - 4 edges
9. `test_normalize_scale_invariant()` - 4 edges
10. `normalize()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `normalize()` --calls--> `test_normalize_wrist_at_origin()`  [INFERRED]
  C:\Users\Michael Maged\Desktop\Projects\Sign language\Sign-Language-\backend\scripts\extract_landmarks.py → C:\Users\Michael Maged\Desktop\Projects\Sign language\Sign-Language-\backend\tests\test_landmarks.py
- `normalize()` --calls--> `test_normalize_scale_invariant()`  [INFERRED]
  C:\Users\Michael Maged\Desktop\Projects\Sign language\Sign-Language-\backend\scripts\extract_landmarks.py → C:\Users\Michael Maged\Desktop\Projects\Sign language\Sign-Language-\backend\tests\test_landmarks.py
- `flip_x()` --calls--> `test_flip_x_negates_x_coords()`  [INFERRED]
  C:\Users\Michael Maged\Desktop\Projects\Sign language\Sign-Language-\backend\scripts\extract_landmarks.py → C:\Users\Michael Maged\Desktop\Projects\Sign language\Sign-Language-\backend\tests\test_landmarks.py
- `flip_x()` --calls--> `test_flip_x_angles_unchanged()`  [INFERRED]
  C:\Users\Michael Maged\Desktop\Projects\Sign language\Sign-Language-\backend\scripts\extract_landmarks.py → C:\Users\Michael Maged\Desktop\Projects\Sign language\Sign-Language-\backend\tests\test_landmarks.py
- `handlePress()` --calls--> `startRecording()`  [INFERRED]
  C:\Users\Michael Maged\Desktop\Projects\Sign language\Sign-Language-\mobile\src\components\MicButton.tsx → C:\Users\Michael Maged\Desktop\Projects\Sign language\Sign-Language-\mobile\src\services\AudioService.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.14
Nodes (18): _angle(), flip_x(), make_detector(), normalize(), process(), Step 1 - Extract MediaPipe hand landmarks from ASL Alphabet dataset images.  Pro, Angle at b formed by vectors b->a and b->c, in radians., Horizontal-flip augmentation: negate x coordinate of each landmark. (+10 more)

### Community 1 - "Community 1"
Cohesion: 0.18
Nodes (2): pingServer(), checkServer()

### Community 2 - "Community 2"
Cohesion: 0.31
Nodes (7): _decode_image(), _frame_to_features(), _pad_or_trim(), predict_word(), Decode image bytes to RGB numpy array, honouring EXIF rotation., Extract 126-dim feature vector (left + right hand) from one RGB frame., Return array of shape (SEQ_LEN, N_FEATURES).

### Community 3 - "Community 3"
Cohesion: 0.36
Nodes (5): _angle(), _decode_image(), normalize(), predict_gesture(), Decode image bytes → RGB numpy array, honouring EXIF rotation.

### Community 4 - "Community 4"
Cohesion: 0.36
Nodes (7): _extract_frame_features(), _make_detector(), process(), WLASL Step 1 -- Extract MediaPipe hand landmarks from WLASL video files.  Uses H, Flatten HandLandmarker result into a 126-dim vector (left + right hand)., Extract a (SEQ_LEN, 126) array from a video clip., _video_to_sequence()

### Community 5 - "Community 5"
Cohesion: 0.29
Nodes (2): textToSign(), handleSpeechResult()

### Community 6 - "Community 6"
Cohesion: 0.29
Nodes (2): handleRecord(), predictWord()

### Community 7 - "Community 7"
Cohesion: 0.53
Nodes (5): _pad_or_trim(), Take first seq_len frames; zero-pad if shorter., test_exact_length_unchanged(), test_pad_short_sequence(), test_trim_long_sequence()

### Community 8 - "Community 8"
Cohesion: 0.5
Nodes (4): _augment_noise(), Step 2 — Train XGBoost classifier on extracted landmarks.  Reads:   data/landmar, Add Gaussian noise copies to improve robustness to small perturbations., train()

### Community 9 - "Community 9"
Cohesion: 0.5
Nodes (3): startRecording(), stopRecordingAndTranscribe(), handlePress()

### Community 10 - "Community 10"
Cohesion: 0.67
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 0.67
Nodes (1): Export one representative landmark set per ASL letter from landmarks.csv.  Reads

### Community 12 - "Community 12"
Cohesion: 0.67
Nodes (1): Picks one representative image per letter from the ASL Alphabet dataset and copi

### Community 13 - "Community 13"
Cohesion: 0.67
Nodes (1): WLASL Step 2 -- Train LSTM classifier on extracted landmark sequences.  Reads:

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

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **20 isolated node(s):** `Decode image bytes → RGB numpy array, honouring EXIF rotation.`, `Decode image bytes to RGB numpy array, honouring EXIF rotation.`, `Extract 126-dim feature vector (left + right hand) from one RGB frame.`, `Return array of shape (SEQ_LEN, N_FEATURES).`, `Export one representative landmark set per ASL letter from landmarks.csv.  Reads` (+15 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 14`** (2 nodes): `main.py`, `root()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (2 nodes): `sign.py`, `text_to_sign()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (2 nodes): `speech.py`, `speech_to_text()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (2 nodes): `HandSkeletonView.tsx`, `HandSkeletonView()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (1 nodes): `App.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (1 nodes): `LetterCard.styles.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (1 nodes): `LetterCard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (1 nodes): `MicButton.styles.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (1 nodes): `WordRow.styles.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (1 nodes): `WordRow.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `SignModel.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `GestureScreen.styles.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `HomeScreen.styles.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 2 inferred relationships involving `normalize()` (e.g. with `test_normalize_wrist_at_origin()` and `test_normalize_scale_invariant()`) actually correct?**
  _`normalize()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `flip_x()` (e.g. with `test_flip_x_negates_x_coords()` and `test_flip_x_angles_unchanged()`) actually correct?**
  _`flip_x()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Decode image bytes → RGB numpy array, honouring EXIF rotation.`, `Decode image bytes to RGB numpy array, honouring EXIF rotation.`, `Extract 126-dim feature vector (left + right hand) from one RGB frame.` to the rest of the system?**
  _20 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._