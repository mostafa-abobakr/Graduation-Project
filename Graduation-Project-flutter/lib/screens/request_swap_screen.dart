import 'package:flutter/material.dart';
import '../services/api_service.dart';

class RequestSwapScreen extends StatefulWidget {
  final ShiftSchedule? shift;
  const RequestSwapScreen({super.key, this.shift});

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
  List<Map<String, dynamic>> _employees = [];
  bool _isLoading = true;
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    _loadEmployees();
  }

  String _getInitials(String name) {
    if (name.isEmpty) return 'EM';
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  }

  Future<void> _loadEmployees() async {
    try {
      final list = await ApiService.getSchedules();
      final uniqueMap = <int, Map<String, dynamic>>{};
      for (final s in list) {
        if (s.empID != ApiService.currentEmployeeId && s.empID != 0) {
          final name = s.employeeName.isNotEmpty ? s.employeeName : 'Employee #${s.empID}';
          uniqueMap[s.empID] = {
            'id': s.empID,
            'name': name,
            'initials': _getInitials(name),
            'role': s.shiftType,
            'isAvailable': true,
          };
        }
      }
      if (mounted) {
        setState(() {
          _employees = uniqueMap.values.toList();
          if (_employees.isEmpty) {
            _employees = [
              {'id': 101, 'initials': 'SJ', 'name': 'Sarah Johnson', 'role': 'Server', 'isAvailable': true},
              {'id': 102, 'initials': 'MW', 'name': 'Mike Wilson', 'role': 'Server', 'isAvailable': true},
              {'id': 103, 'initials': 'ED', 'name': 'Emily Davis', 'role': 'Server', 'isAvailable': false},
              {'id': 104, 'initials': 'JB', 'name': 'James Brown', 'role': 'Server', 'isAvailable': true},
              {'id': 105, 'initials': 'LA', 'name': 'Lisa Anderson', 'role': 'Server', 'isAvailable': true},
            ].where((emp) => emp['id'] != ApiService.currentEmployeeId).toList();
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

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

                    if (_isLoading)
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.symmetric(vertical: 40),
                          child: CircularProgressIndicator(color: primaryGreen),
                        ),
                      )
                    else if (_employees.isEmpty)
                      const Center(
                        child: Text(
                          'No available employees to swap with.',
                          style: TextStyle(color: subTextColor, fontSize: 15),
                        ),
                      )
                    else
                      ...List.generate(_employees.length, (index) {
                        final emp = _employees[index];
                        return _buildEmployeeCard(
                          index: index,
                          initials: emp['initials'] ?? 'EM',
                          name: emp['name'] ?? '',
                          role: emp['role'] ?? 'Staff',
                          isAvailable: emp['isAvailable'] ?? true,
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
            onPressed: (_selectedIndex != null && !_isSending)
                ? () async {
                    final messenger = ScaffoldMessenger.of(context);
                    final navigator = Navigator.of(context);
                    setState(() {
                      _isSending = true;
                    });
                    
                    // Add swap request to pending list dynamically
                    final shift = widget.shift;
                    final dateStr = shift != null ? _formatDate(shift.day) : 'Apr 1';
                    ApiService.pendingRequests.add({
                      'type': 'swap',
                      'date': dateStr,
                    });

                    await Future.delayed(const Duration(milliseconds: 1500));
                    if (mounted) {
                      final selectedEmp = _employees[_selectedIndex!];
                      final empName = selectedEmp['name'] ?? 'Selected Employee';
                      messenger.showSnackBar(
                        SnackBar(
                          content: Text('Swap request sent successfully to $empName and management.'),
                          backgroundColor: primaryGreen,
                        ),
                      );
                      navigator.pop();
                    }
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
            child: _isSending
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2.5,
                    ),
                  )
                : Text(
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

  // دالة مساعدة لتنسيق التاريخ
  String _formatDate(String dayStr) {
    final parsed = DateTime.tryParse(dayStr);
    if (parsed == null) return dayStr;
    final now = DateTime.now();
    final difference = DateTime(parsed.year, parsed.month, parsed.day)
        .difference(DateTime(now.year, now.month, now.day))
        .inDays;

    if (difference == 0) return 'Today';
    if (difference == 1) return 'Tomorrow';

    final weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    final weekday = weekdays[parsed.weekday - 1];
    final month = months[parsed.month - 1];
    return '$weekday • $month ${parsed.day}';
  }

  // دالة مساعدة لتنسيق الوقت إلى 12-hour AM/PM
  String _formatTime(String timeStr) {
    final parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    int hour = int.tryParse(parts[0]) ?? 0;
    final minute = parts[1];
    final ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour == 0) hour = 12;
    final hourFormatted = hour.toString().padLeft(2, '0');
    return '$hourFormatted:$minute $ampm';
  }

  // كارت المناوبة المراد تبديلها
  Widget _buildSwappingShiftCard() {
    final shift = widget.shift;
    final title = shift?.shiftType ?? 'Evening Shift';
    final dateStr = shift != null ? _formatDate(shift.day) : 'Tomorrow • Apr 1';
    final timeStr = shift != null ? '${_formatTime(shift.startTime)} - ${_formatTime(shift.endTime)}' : '02:00 PM - 10:00 PM';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Swapping Shift', style: TextStyle(color: subTextColor, fontSize: 13)),
          const SizedBox(height: 8),
          Text(title, style: const TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text('$dateStr • $timeStr', style: const TextStyle(color: subTextColor, fontSize: 13)),
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
