import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = 'https://resturantai.runasp.net';
  static String? token;

  // تسجيل الدخول
  static Future<bool> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/Auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        if (response.body.startsWith('{')) {
          final data = json.decode(response.body);
          token = data['token'] ?? data['jwt'] ?? data['accessToken'];
        } else {
          token = response.body;
        }
        return true;
      }
      return false;
    } catch (e) {
      print('Login error: $e');
      return false;
    }
  }

  // جلب جدول المواعيد
  static Future<List<ShiftSchedule>> getSchedules() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/Schedule'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => ShiftSchedule.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Get schedules error: $e');
      return [];
    }
  }
}

class ShiftSchedule {
  final int scheduleID;
  final String day;
  final String startTime;
  final String endTime;
  final String shiftType;

  ShiftSchedule({
    required this.scheduleID,
    required this.day,
    required this.startTime,
    required this.endTime,
    required this.shiftType,
  });

  factory ShiftSchedule.fromJson(Map<String, dynamic> json) {
    return ShiftSchedule(
      scheduleID: json['scheduleID'] ?? json['scheduleId'] ?? 0,
      day: json['day'] ?? '',
      startTime: json['startTime'] ?? '09:00:00',
      endTime: json['endTime'] ?? '17:00:00',
      shiftType: json['shiftType'] ?? 'Day Shift',
    );
  }
}
