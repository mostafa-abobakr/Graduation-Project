import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = 'https://resturantai.runasp.net';
  static String? token;
  static int? currentEmployeeId;
  static String? currentEmployeeName;
  static String? currentEmployeeEmail;
  static String? currentEmployeeRole;
  static String? currentEmployeePhone;
  static String? currentEmployeeRestaurant;
  static List<Map<String, dynamic>> pendingRequests = [];

  // Helper method to parse employee details from a JWT token
  static void parseDetailsFromToken(String tokenStr) {
    try {
      final parts = tokenStr.split('.');
      if (parts.length < 2) return;
      final payload = parts[1];
      // Normalize base64 string
      var normalized = base64Url.normalize(payload);
      final decoded = utf8.decode(base64Url.decode(normalized));
      final Map<String, dynamic> payloadMap = json.decode(decoded);
      
      // Try to find employee ID in common claims
      final dynamic empIdVal = payloadMap['empID'] ?? 
                              payloadMap['empId'] ?? 
                              payloadMap['employeeId'] ?? 
                              payloadMap['id'] ?? 
                              payloadMap['sub'] ??
                              payloadMap['unique_name'];
      if (empIdVal != null) {
        currentEmployeeId = int.tryParse(empIdVal.toString());
      }

      // Try to find email in common claims
      final dynamic emailVal = payloadMap['email'] ?? 
                               payloadMap['emailaddress'] ?? 
                               payloadMap['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
      if (emailVal != null) {
        currentEmployeeEmail = emailVal.toString();
      }

      // Try to find name in common claims
      final dynamic nameVal = payloadMap['name'] ?? 
                              payloadMap['employeeName'] ?? 
                              payloadMap['unique_name'] ??
                              payloadMap['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
      if (nameVal != null) {
        currentEmployeeName = nameVal.toString();
      }

      // Try to find role in common claims
      final dynamic roleVal = payloadMap['role'] ?? 
                              payloadMap['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      if (roleVal != null) {
        currentEmployeeRole = roleVal.toString();
      }

      // Try to find phone number in common claims
      final dynamic phoneVal = payloadMap['phone_number'] ?? 
                               payloadMap['phoneNumber'] ?? 
                               payloadMap['phone'] ?? 
                               payloadMap['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/mobilephone'];
      if (phoneVal != null) {
        currentEmployeePhone = phoneVal.toString();
      }

      // Try to find restaurant in common claims
      final dynamic restVal = payloadMap['restaurant'] ?? 
                              payloadMap['restaurant_id'] ?? 
                              payloadMap['restaurantId'] ?? 
                              payloadMap['restaurantName'] ?? 
                              payloadMap['RestaurantId'];
      if (restVal != null) {
        currentEmployeeRestaurant = restVal.toString();
      }
    } catch (e) {
      print('Error parsing JWT token details: $e');
    }
  }

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
          
          final dynamic rawEmpId = data['empID'] ?? data['empId'] ?? data['employeeId'] ?? data['id'];
          if (rawEmpId != null) {
            currentEmployeeId = int.tryParse(rawEmpId.toString());
          }
          final dynamic rawName = data['employeeName'] ?? data['name'];
          if (rawName != null) {
            currentEmployeeName = rawName.toString();
          }
          final dynamic rawEmail = data['email'] ?? data['emailAddress'];
          if (rawEmail != null) {
            currentEmployeeEmail = rawEmail.toString();
          }
          final dynamic rawRole = data['role'] ?? data['employeeRole'];
          if (rawRole != null) {
            currentEmployeeRole = rawRole.toString();
          }
          final dynamic rawPhone = data['phone_number'] ?? data['phoneNumber'] ?? data['phone'];
          if (rawPhone != null) {
            currentEmployeePhone = rawPhone.toString();
          }
          final dynamic rawRestaurant = data['restaurant'] ?? data['restaurant_id'] ?? data['restaurantId'] ?? data['restaurantName'];
          if (rawRestaurant != null) {
            currentEmployeeRestaurant = rawRestaurant.toString();
          }
        } else {
          token = response.body;
        }

        if (token != null) {
          parseDetailsFromToken(token!);
        }
        return true;
      }
      return false;
    } catch (e) {
      print('Login error: $e');
      return false;
    }
  }

  // تغيير كلمة المرور
  static Future<bool> changePassword(String currentPassword, String newPassword) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/Settings/change-password'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        }),
      );
      return response.statusCode == 200;
    } catch (e) {
      print('Change password error: $e');
      return false;
    }
  }

  // Get Employee Profile Details
  static Future<Map<String, dynamic>?> getEmployeeProfile(int empId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/Employees/single/$empId'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );
      if (response.statusCode == 200) {
        return json.decode(response.body) as Map<String, dynamic>;
      }
      return null;
    } catch (e) {
      print('Get employee profile error: $e');
      return null;
    }
  }

  // Get Restaurant Details
  static Future<Map<String, dynamic>?> getRestaurantDetails(String restId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/Restaurant/$restId'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );
      if (response.statusCode == 200) {
        return json.decode(response.body) as Map<String, dynamic>;
      }
      return null;
    } catch (e) {
      print('Get restaurant details error: $e');
      return null;
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
  final int empID;
  final String employeeName;

  ShiftSchedule({
    required this.scheduleID,
    required this.day,
    required this.startTime,
    required this.endTime,
    required this.shiftType,
    required this.empID,
    required this.employeeName,
  });

  factory ShiftSchedule.fromJson(Map<String, dynamic> json) {
    return ShiftSchedule(
      scheduleID: json['scheduleID'] ?? json['scheduleId'] ?? 0,
      day: json['day'] ?? '',
      startTime: json['startTime'] ?? '09:00:00',
      endTime: json['endTime'] ?? '17:00:00',
      shiftType: json['shiftType'] ?? 'Day Shift',
      empID: json['empID'] ?? json['empId'] ?? 0,
      employeeName: json['employeeName'] ?? '',
    );
  }
}
