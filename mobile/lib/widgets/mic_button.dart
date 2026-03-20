import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart';

class MicButton extends StatefulWidget {
  final Function(String) onResult;

  const MicButton({super.key, required this.onResult});

  @override
  State<MicButton> createState() => _MicButtonState();
}

class _MicButtonState extends State<MicButton> {
  final SpeechToText _speech = SpeechToText();
  bool isListening = false;

  void startListening() async {
    bool available = await _speech.initialize();

    if (available) {
      setState(() => isListening = true);

      _speech.listen(
        onResult: (result) {
          widget.onResult(result.recognizedWords);
        },
      );
    }
  }

  void stopListening() {
    _speech.stop();
    setState(() => isListening = false);
  }

  @override
  Widget build(BuildContext context) {
    return FloatingActionButton(
      onPressed: isListening ? stopListening : startListening,
      child: Icon(isListening ? Icons.stop : Icons.mic),
    );
  }
}