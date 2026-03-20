import 'package:flutter/material.dart';
import '../widgets/mic_button.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String text = "Press mic and speak";
  List<String> signs = [];

  void onSpeechResult(String recognizedText) {
    setState(() {
      text = recognizedText;

      // TEMP: fake mapping (we replace with API later)
      signs = recognizedText.toUpperCase().split(" ");
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Sign Translator"),
        centerTitle: true,
      ),
      body: Column(
        children: [
          const SizedBox(height: 20),

          // Recognized Text
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              text,
              style: const TextStyle(fontSize: 20),
              textAlign: TextAlign.center,
            ),
          ),

          const Divider(),

          // Sign Output
          Expanded(
            child: signs.isEmpty
                ? const Center(child: Text("No signs yet"))
                : ListView.builder(
                    itemCount: signs.length,
                    itemBuilder: (context, index) {
                      final sign = signs[index].toLowerCase();

                      return Column(
                        children: [
                          Text(sign.toUpperCase()),
                          const SizedBox(height: 10),
                          Image.asset(
                            'assets/signs/$sign.gif',
                            height: 120,
                            errorBuilder: (context, error, stackTrace) {
                              return const Text("No sign available");
                            },
                          ),
                          const Divider(),
                        ],
                      );
                    },
                  ),
          ),

          // Mic Button
          Padding(
            padding: const EdgeInsets.all(20),
            child: MicButton(onResult: onSpeechResult),
          ),
        ],
      ),
    );
  }
}