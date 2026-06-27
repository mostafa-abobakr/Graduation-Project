import 'package:flutter/material.dart';

class ForgotPasswordScreen extends StatelessWidget {
  const ForgotPasswordScreen({super.key});

  // نفس الألوان المستخدمة لضمان تناسق التطبيق
  static const Color bgColor = Color(0xFF141924);
  static const Color fieldColor = Color(0xFF1F2533);
  static const Color borderColor = Color(0xFF2C3446);
  static const Color primaryGreen = Color(0xFF1DCE82);
  static const Color textColor = Colors.white;
  static const Color subTextColor = Color(0xFF9198A8);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 24.0),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: constraints.maxHeight - 48.0,
                ),
                child: IntrinsicHeight(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // زر الرجوع
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: fieldColor,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: borderColor, width: 1),
                        ),
                        child: IconButton(
                          icon: const Icon(
                            Icons.arrow_back_ios_new,
                            color: subTextColor,
                            size: 18,
                          ),
                          onPressed: () {
                            Navigator.pop(context); // للرجوع للصفحة السابقة
                          },
                        ),
                      ),
                      const SizedBox(height: 32),

                      // العنوان
                      const Text(
                        'Forgot Password?',
                        style: TextStyle(
                          color: textColor,
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),

                      // النص الفرعي
                      const Text(
                        "No worries! Enter your email address and we'll\nsend you a link to reset your password.",
                        style: TextStyle(
                          color: subTextColor,
                          fontSize: 14,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 40),

                      // حقل البريد الإلكتروني
                      _buildLabel('Email Address'),
                      const SizedBox(height: 8),
                      _buildTextField(
                        hintText: 'Enter your email',
                        prefixIcon: Icons.email_outlined,
                      ),

                      // لدفع الزر إلى الأسفل
                      const Spacer(),
                      const SizedBox(height: 40),

                      // زر إرسال الرابط
                      SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: ElevatedButton(
                          onPressed: () {
                            // كود إرسال رابط استعادة كلمة المرور
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: primaryGreen,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            elevation: 0,
                          ),
                          child: const Text(
                            'Send Reset Link',
                            style: TextStyle(
                              color: textColor,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // نص تذكرت كلمة المرور؟ تسجيل الدخول
                      Center(
                        child: GestureDetector(
                          onTap: () {
                            Navigator.pushReplacementNamed(context, '/signin');
                          },
                          child: RichText(
                            text: const TextSpan(
                              text: 'Remember your password? ',
                              style: TextStyle(color: subTextColor, fontSize: 14),
                              children: [
                                TextSpan(
                                  text: 'Sign In',
                                  style: TextStyle(
                                    color: primaryGreen,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  // ويدجت العناوين
  Widget _buildLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        color: subTextColor,
        fontSize: 13,
        fontWeight: FontWeight.w500,
      ),
    );
  }

  // ويدجت حقل الإدخال مع دعم الأيقونة الجانبية (Prefix Icon)
  Widget _buildTextField({
    required String hintText,
    required IconData prefixIcon,
  }) {
    return TextField(
      style: const TextStyle(color: textColor, fontSize: 15),
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: TextStyle(color: subTextColor.withOpacity(0.5), fontSize: 15),
        filled: true,
        fillColor: fieldColor,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
        prefixIcon: Icon(
          prefixIcon,
          color: subTextColor,
          size: 22,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: borderColor, width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: borderColor, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryGreen, width: 1),
        ),
      ),
    );
  }
}
