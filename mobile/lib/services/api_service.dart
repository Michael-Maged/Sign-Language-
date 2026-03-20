import 'package:http/http.dart' as http;
import 'dart:convert';

class ApiService {
  static const baseUrl = "http://10.0.2.2:8000";

  static Future<List<String>> textToSign(String text) async {
    final response = await http.post(
      Uri.parse("$baseUrl/text-to-sign"),
      body: {"text": text},
    );

    final data = jsonDecode(response.body);
    return List<String>.from(data["sequence"]);
  }
}