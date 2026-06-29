import 'package:flutter/material.dart';

class TimesheetScreen extends StatefulWidget {
  const TimesheetScreen({super.key});

  @override
  State<TimesheetScreen> createState() => _TimesheetScreenState();
}

class _TimesheetScreenState extends State<TimesheetScreen> {
  // الألوان متطابقة مع باقي التطبيق
  static const Color bgColor = Color(0xFF141924);
  static const Color cardColor = Color(0xFF1F2533);
  static const Color borderColor = Color(0xFF2C3446);
  static const Color primaryGreen = Color(0xFF1DCE82);
  static const Color textColor = Colors.white;
  static const Color subTextColor = Color(0xFF9198A8);

  bool _isExporting = false;
  int _weeksOffset = 0;

  @override
  Widget build(BuildContext context) {
    final today = DateTime.now();
    final targetDay = today.add(Duration(days: _weeksOffset * 7));
    final monday = targetDay.subtract(Duration(days: targetDay.weekday - 1));
    final tuesday = monday.add(const Duration(days: 1));
    final wednesday = monday.add(const Duration(days: 2));
    final sundayEnd = monday.add(const Duration(days: 6));

    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    final String dateRange = '${months[monday.month - 1]} ${monday.day} - ${months[sundayEnd.month - 1]} ${sundayEnd.day}';
    final String mondayStr = '${months[monday.month - 1]} ${monday.day}';
    final String tuesdayStr = '${months[tuesday.month - 1]} ${tuesday.day}';
    final String wednesdayStr = '${months[wednesday.month - 1]} ${wednesday.day}';

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // الهيدر (العنوان وزر التحميل)
              _buildHeader(),
              const SizedBox(height: 24),

              // أزرار التنقل بين التواريخ
              _buildDateNavigation(dateRange),
              const SizedBox(height: 24),

              // كارت ملخص الساعات الإجمالية
              _buildSummaryCard(),
              const SizedBox(height: 32),

              // عنوان قسم الإدخالات
              const Text('Time Entries', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),

              // قائمة أيام العمل (الإدخالات) مع تأثير انتقال متحرك
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 350),
                transitionBuilder: (Widget child, Animation<double> animation) {
                  return FadeTransition(
                    opacity: animation,
                    child: SizeTransition(
                      sizeFactor: animation,
                      alignment: Alignment.topCenter,
                      child: child,
                    ),
                  );
                },
                child: Column(
                  key: ValueKey<int>(_weeksOffset),
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildTimeEntryCard(
                      day: 'Monday',
                      date: mondayStr,
                      clockIn: '09:00 AM',
                      clockOut: '05:00 PM',
                      total: '8h 0m',
                      status: 'Approved',
                    ),
                    const SizedBox(height: 12),
                    _buildTimeEntryCard(
                      day: 'Tuesday',
                      date: tuesdayStr,
                      clockIn: '09:15 AM',
                      clockOut: '05:30 PM',
                      total: '8h 15m',
                      status: 'Approved',
                    ),
                    const SizedBox(height: 12),
                    _buildTimeEntryCard(
                      day: 'Wednesday',
                      date: wednesdayStr,
                      clockIn: '09:00 AM',
                      clockOut: '05:00 PM',
                      total: '8h 0m',
                      status: 'Approved',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
      // شريط التنقل السفلي مع تحديد "Timesheet"
      bottomNavigationBar: _buildBottomNav(context),
    );
  }

  // الهيدر
  Widget _buildHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        const Text('Timesheet', style: TextStyle(color: textColor, fontSize: 28, fontWeight: FontWeight.bold)),
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: cardColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: borderColor),
          ),
          child: _isExporting
              ? const Padding(
                  padding: EdgeInsets.all(12),
                  child: CircularProgressIndicator(color: primaryGreen, strokeWidth: 2.0),
                )
              : IconButton(
                  icon: const Icon(Icons.file_download_outlined, color: subTextColor, size: 22),
                  onPressed: () async {
                    final messenger = ScaffoldMessenger.of(context);
                    setState(() {
                      _isExporting = true;
                    });
                    await Future.delayed(const Duration(seconds: 1));
                    if (mounted) {
                      setState(() {
                        _isExporting = false;
                      });
                      messenger.showSnackBar(
                        const SnackBar(
                          content: Text('Timesheet report exported successfully as PDF.'),
                          backgroundColor: primaryGreen,
                        ),
                      );
                    }
                  },
                ),
        ),
      ],
    );
  }

  // أزرار التنقل بين التواريخ
  Widget _buildDateNavigation(String dateRange) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        _buildNavButton(Icons.arrow_back_ios_new, () {
          setState(() {
            _weeksOffset--;
          });
        }),
        Text(dateRange, style: const TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w500)),
        _buildNavButton(Icons.arrow_forward_ios, () {
          if (_weeksOffset < 0) {
            setState(() {
              _weeksOffset++;
            });
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Cannot view future timesheet logs.'),
                backgroundColor: Colors.redAccent,
              ),
            );
          }
        }),
      ],
    );
  }

  // الأزرار المربعة الجانبية (أسهم التنقل)
  Widget _buildNavButton(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor),
        ),
        child: Icon(icon, color: subTextColor, size: 16),
      ),
    );
  }

  // الكارت الأخضر (ملخص الساعات)
  Widget _buildSummaryCard() {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF22D086), Color(0xFF13AD6B)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Total Hours', style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 14)),
                  const SizedBox(height: 8),
                  const Text('40h 30m', style: TextStyle(color: textColor, fontSize: 32, fontWeight: FontWeight.bold)),
                ],
              ),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.access_time, color: textColor, size: 28),
              ),
            ],
          ),
          const SizedBox(height: 24),
          // خط فاصل شفاف
          Container(height: 1, color: Colors.white.withOpacity(0.2)),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Regular: 40h', style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 14)),
              Text('Overtime: 0.5h', style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 14)),
            ],
          ),
        ],
      ),
    );
  }

  // كارت الإدخال اليومي (Time Entry Card)
  Widget _buildTimeEntryCard({
    required String day,
    required String date,
    required String clockIn,
    required String clockOut,
    required String total,
    required String status,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(day, style: const TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w500)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: primaryGreen.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(status, style: const TextStyle(color: primaryGreen, fontSize: 12, fontWeight: FontWeight.w500)),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(date, style: const TextStyle(color: subTextColor, fontSize: 13)),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildTimeColumn('Clock In', clockIn),
              _buildTimeColumn('Clock Out', clockOut),
              _buildTimeColumn('Total', total, isBold: true),
            ],
          ),
        ],
      ),
    );
  }

  // ويدجت المساعدة لأعمدة الوقت (Clock In / Clock Out / Total)
  Widget _buildTimeColumn(String label, String value, {bool isBold = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: subTextColor, fontSize: 12)),
        const SizedBox(height: 6),
        Text(
          value,
          style: TextStyle(
            color: textColor,
            fontSize: 14,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
          ),
        ),
      ],
    );
  }

  // شريط التنقل السفلي
  Widget _buildBottomNav(BuildContext context) {
    return Container(
      height: 85,
      decoration: const BoxDecoration(
        color: cardColor,
        border: Border(top: BorderSide(color: borderColor, width: 1)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          // Home ليس محدداً
          _buildNavItem(context, icon: Icons.calendar_today, label: 'Home', isSelected: false, route: '/home'),
          // Timesheet هو المحدد
          _buildNavItem(context, icon: Icons.access_time, label: 'Timesheet', isSelected: true, route: '/timesheet'),
          // Profile ليس محدداً
          _buildNavItem(context, icon: Icons.person_outline, label: 'Profile', isSelected: false, route: '/profile'),
        ],
      ),
    );
  }

  Widget _buildNavItem(BuildContext context, {required IconData icon, required String label, required bool isSelected, required String route}) {
    return GestureDetector(
      onTap: () {
        if (!isSelected) {
          // يمكن تفعيل هذا السطر للانتقال بين الصفحات الرئيسية بسلاسة
          Navigator.pushReplacementNamed(context, route);
        }
      },
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: isSelected ? primaryGreen : Colors.transparent,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: isSelected ? textColor : subTextColor, size: 24),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: TextStyle(
              color: isSelected ? primaryGreen : subTextColor,
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
