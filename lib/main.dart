import 'package:flutter/material.dart';

// استيراد جميع الصفحات
import 'screens/sign_in_screen.dart';
import 'screens/forgot_password_screen.dart';
import 'screens/home_screen.dart';
import 'screens/request_swap_screen.dart';
import 'screens/request_time_off_screen.dart'; // الاستيراد
import 'screens/timesheet_screen.dart';
import 'screens/profile_screen.dart';


void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Bella\'s Kitchen',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        scaffoldBackgroundColor: const Color(0xFF141924),
      ),

      home: const SignInScreen(),

      routes: {
        '/signin': (context) => const SignInScreen(),
        '/forgot_password': (context) => const ForgotPasswordScreen(),
        '/home': (context) => const HomeScreen(),
        '/request_swap': (context) => const RequestSwapScreen(),
        '/request_time_off': (context) => const RequestTimeOffScreen(),
        '/timesheet': (context) => const TimesheetScreen(),
        '/profile': (context) => const ProfileScreen(),

      },
    );
  }
}
