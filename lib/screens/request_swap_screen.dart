import 'package:flutter/material.dart';

class RequestSwapScreen extends StatefulWidget {
  const RequestSwapScreen({super.key});

  @override
  State<RequestSwapScreen> createState() => _RequestSwapScreenState();
}

class _RequestSwapScreenState extends State<RequestSwapScreen> {
  // الألوان
  static const Color bgColor = Color(0xFF141924);
  static const Color cardColor = Color(0xFF1F2533);
  static const Color borderColor = Color(0xFF2C3446);
  static const Color primaryGreen = Color(0xFF1DCE82);
  static const Color textColor = Colors.white;
  static const Color subTextColor = Color(0xFF9198A8);

  // متغير لحفظ الموظف الذي تم اختياره
  int? _selectedIndex;

  // قائمة الموظفين (لتسهيل إدارتها برمجياً)
  final List<Map<String, dynamic>> _employees = [
    {'initials': 'SJ', 'name': 'Sarah Johnson', 'role': 'Server', 'isAvailable': true},
    {'initials': 'MW', 'name': 'Mike Wilson', 'role': 'Server', 'isAvailable': true},
    {'initials': 'ED', 'name': 'Emily Davis', 'role': 'Server', 'isAvailable': false},
    {'initials': 'JB', 'name': 'James Brown', 'role': 'Server', 'isAvailable': true},
    {'initials': 'LA', 'name': 'Lisa Anderson', 'role': 'Server', 'isAvailable': true},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Column(
          children: [
            // الهيدر (العنوان وزر الرجوع)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: cardColor,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: borderColor),
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new, color: subTextColor, size: 18),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ),
                  const SizedBox(width: 16),
                  const Text(
                    'Request Swap',
                    style: TextStyle(color: textColor, fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),

            // المحتوى الأساسي
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 16),
                    // كارت المناوبة
                    _buildSwappingShiftCard(),
                    const SizedBox(height: 24),
                    // شريط البحث
                    _buildSearchBar(),
                    const SizedBox(height: 32),
                    // عنوان الموظفين
                    const Text(
                      'Available Employees',
                      style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 16),

                    // توليد قائمة الموظفين بناءً على المتغير _employees
                    ...List.generate(_employees.length, (index) {
                      final emp = _employees[index];
                      return _buildEmployeeCard(
                        index: index,
                        initials: emp['initials'],
                        name: emp['name'],
                        role: emp['role'],
                        isAvailable: emp['isAvailable'],
                      );
                    }),

                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),

      // الزر السفلي (يتفعل ويتغير لونه عند اختيار موظف متاح)
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(24.0),
        decoration: const BoxDecoration(
          color: bgColor,
          border: Border(top: BorderSide(color: borderColor)),
        ),
        child: SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            // إذا كان التحديد null يكون الزر غير مفعل
            onPressed: _selectedIndex != null
                ? () {
              // أكشن عند إرسال الطلب (مثال: إظهار رسالة نجاح والعودة)
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Swap request sent successfully!')),
              );
              Navigator.pop(context);
            }
                : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: _selectedIndex != null ? primaryGreen : const Color(0xFF1E2636),
              disabledBackgroundColor: const Color(0xFF1E2636),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 0,
            ),
            child: Text(
              'Send Swap Request',
              style: TextStyle(
                color: _selectedIndex != null ? Colors.white : const Color(0xFF5A6275),
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ),
    );
  }

  // كارت المناوبة المراد تبديلها
  Widget _buildSwappingShiftCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Text('Swapping Shift', style: TextStyle(color: subTextColor, fontSize: 13)),
          SizedBox(height: 8),
          Text('Evening Shift', style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w600)),
          SizedBox(height: 4),
          Text('Tomorrow • Apr 1 • 02:00 PM - 10:00 PM', style: TextStyle(color: subTextColor, fontSize: 13)),
        ],
      ),
    );
  }

  // شريط البحث
  Widget _buildSearchBar() {
    return TextField(
      style: const TextStyle(color: textColor, fontSize: 15),
      decoration: InputDecoration(
        hintText: 'Search employees...',
        hintStyle: TextStyle(color: subTextColor.withOpacity(0.6), fontSize: 15),
        prefixIcon: const Icon(Icons.search, color: subTextColor, size: 22),
        filled: true,
        fillColor: bgColor,
        contentPadding: const EdgeInsets.symmetric(vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: borderColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: borderColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryGreen),
        ),
      ),
    );
  }

  // كارت الموظف مع إمكانية الضغط عليه وتحديده
  Widget _buildEmployeeCard({
    required int index,
    required String initials,
    required String name,
    required String role,
    required bool isAvailable,
  }) {
    // التحقق مما إذا كان هذا الموظف هو المختار حالياً
    bool isSelected = _selectedIndex == index;

    return GestureDetector(
      onTap: isAvailable
          ? () {
        // عند الضغط، قم بتحديث المتغير _selectedIndex برقم هذا الموظف
        setState(() {
          _selectedIndex = index;
        });
      }
          : null, // لا يمكن اختيار الموظف غير المتاح (Unavailable)
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(16),
          // تغيير لون الحدود إلى الأخضر في حالة التحديد
          border: Border.all(
            color: isSelected ? primaryGreen : borderColor,
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 24,
              backgroundColor: isAvailable ? primaryGreen : primaryGreen.withOpacity(0.15),
              child: Text(
                initials,
                style: TextStyle(
                  color: isAvailable ? textColor : subTextColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: TextStyle(
                      color: isAvailable ? textColor : subTextColor,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(role, style: const TextStyle(color: subTextColor, fontSize: 13)),
                ],
              ),
            ),
            if (isAvailable) ...[
              Container(width: 8, height: 8, decoration: const BoxDecoration(color: primaryGreen, shape: BoxShape.circle)),
              const SizedBox(width: 6),
              const Text('Available', style: TextStyle(color: primaryGreen, fontSize: 13, fontWeight: FontWeight.w500)),
            ] else ...[
              const Text('Unavailable', style: TextStyle(color: subTextColor, fontSize: 13, fontWeight: FontWeight.w500)),
            ],
          ],
        ),
      ),
    );
  }
}
