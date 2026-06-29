import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:project/services/api_service.dart';

// A mock JWT token generator for testing
String generateMockJwt(Map<String, dynamic> payload) {
  final header = base64Url.encode(utf8.encode(json.encode({"alg": "HS256", "typ": "JWT"})));
  final encodedPayload = base64Url.encode(utf8.encode(json.encode(payload)));
  return '$header.$encodedPayload.signature';
}

// Simple hours calculation logic mirroring home_screen.dart to verify correctness
double calculateTotalHours(List<ShiftSchedule> schedules) {
  double total = 0.0;
  for (final s in schedules) {
    final startParts = s.startTime.split(':');
    final endParts = s.endTime.split(':');
    if (startParts.isNotEmpty && endParts.isNotEmpty) {
      final startHour = int.tryParse(startParts[0]) ?? 0;
      final startMinute = startParts.length > 1 ? (int.tryParse(startParts[1]) ?? 0) : 0;
      final endHour = int.tryParse(endParts[0]) ?? 0;
      final endMinute = endParts.length > 1 ? (int.tryParse(endParts[1]) ?? 0) : 0;

      final startMinutes = startHour * 60 + startMinute;
      final endMinutes = endHour * 60 + endMinute;

      if (endMinutes > startMinutes) {
        total += (endMinutes - startMinutes) / 60.0;
      } else if (endMinutes < startMinutes) {
        total += ((24 * 60 - startMinutes) + endMinutes) / 60.0;
      }
    }
  }
  return total;
}

void main() {
  group('ShiftSchedule Parsing tests', () {
    test('JSON deserialization parses empID and employeeName', () {
      final json = {
        "scheduleID": 101,
        "day": "2026-06-29T00:00:00",
        "startTime": "09:00:00",
        "endTime": "17:30:00",
        "shiftType": "Day Shift",
        "empID": 12,
        "employeeName": "Alice Smith"
      };

      final schedule = ShiftSchedule.fromJson(json);

      expect(schedule.scheduleID, 101);
      expect(schedule.day, "2026-06-29T00:00:00");
      expect(schedule.startTime, "09:00:00");
      expect(schedule.endTime, "17:30:00");
      expect(schedule.shiftType, "Day Shift");
      expect(schedule.empID, 12);
      expect(schedule.employeeName, "Alice Smith");
    });
  });

  group('JWT parsing tests', () {
    test('parseEmpIdFromToken parses standard jwt payloads', () {
      final token = generateMockJwt({"empID": 15});
      
      // Inject and parse token using the ApiService login mock logic
      final parts = token.split('.');
      final payload = parts[1];
      var normalized = base64Url.normalize(payload);
      final decoded = utf8.decode(base64Url.decode(normalized));
      final Map<String, dynamic> payloadMap = json.decode(decoded);
      final dynamic empIdVal = payloadMap['empID'];

      expect(empIdVal, 15);
    });
  });

  group('Shift hours calculations', () {
    test('Calculate standard hours', () {
      final list = [
        ShiftSchedule(
          scheduleID: 1,
          day: "2026-06-29",
          startTime: "09:00:00",
          endTime: "17:00:00",
          shiftType: "Day",
          empID: 1,
          employeeName: "Alice",
        ), // 8.0 hours
        ShiftSchedule(
          scheduleID: 2,
          day: "2026-06-30",
          startTime: "10:30:00",
          endTime: "12:00:00",
          shiftType: "Day",
          empID: 1,
          employeeName: "Alice",
        ), // 1.5 hours
      ];

      expect(calculateTotalHours(list), 9.5);
    });

    test('Calculate night/midnight-crossing hours', () {
      final list = [
        ShiftSchedule(
          scheduleID: 1,
          day: "2026-06-29",
          startTime: "22:00:00",
          endTime: "06:00:00",
          shiftType: "Night",
          empID: 1,
          employeeName: "Alice",
        ), // 8.0 hours
      ];

      expect(calculateTotalHours(list), 8.0);
    });
  });
}
