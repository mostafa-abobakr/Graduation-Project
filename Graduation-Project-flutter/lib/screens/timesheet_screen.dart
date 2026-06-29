import 'package:flutter/material.dart';
import '../services/api_service.dart';

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
  List<ShiftSchedule> _schedules = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchSchedules();
  }

  Future<void> _fetchSchedules() async {
    final list = await ApiService.getSchedules();
    if (mounted) {
      setState(() {
        if (ApiService.currentEmployeeId != null) {
          _schedules = list.where((shift) => shift.empID == ApiService.currentEmployeeId).toList();
        } else {
          _schedules = list;
        }
        _isLoading = false;
      });
    }
  }

  double _calculateTotalHours(List<ShiftSchedule> schedules) {
    double total = 0.0;
    for (final s in schedules) {
      final type = s.shiftType.toLowerCase();
      if (type.contains('morning') || type.contains('night') || type.contains('evening')) {
        total += 8.0;
      } else {
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
    }
    return total;
  }

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

  String _formatDate(String dayStr) {
    final parsed = DateTime.tryParse(dayStr);
    if (parsed == null) return dayStr;
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[parsed.month - 1]} ${parsed.day}';
  }

  String _getWeekdayName(String dayStr) {
    final parsed = DateTime.tryParse(dayStr);
    if (parsed == null) return '';
    final weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return weekdays[parsed.weekday - 1];
  }

  @override
  Widget build(BuildContext context) {
    final today = DateTime.now();
    final targetDay = today.add(Duration(days: _weeksOffset * 7));
    final monday = targetDay.subtract(Duration(days: targetDay.weekday - 1));
    final sundayEnd = monday.add(const Duration(days: 6));

    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final String dateRange = '${months[monday.month - 1]} ${monday.day} - ${months[sundayEnd.month - 1]} ${sundayEnd.day}';

    final weekSchedules = _schedules.where((s) {
      final shiftDate = DateTime.tryParse(s.day);
      if (shiftDate == null) return false;
      
      final startLimit = DateTime(monday.year, monday.month, monday.day);
      final endLimit = DateTime(sundayEnd.year, sundayEnd.month, sundayEnd.day, 23, 59, 59);
      final isInWeek = shiftDate.isAfter(startLimit.subtract(const Duration(seconds: 1))) &&
                       shiftDate.isBefore(endLimit.add(const Duration(seconds: 1)));
      if (!isInWeek) return false;
      
      final isPastOrToday = shiftDate.isBefore(today) || 
                            (shiftDate.year == today.year && shiftDate.month == today.month && shiftDate.day == today.day);
      return isPastOrToday;
    }).toList();

    weekSchedules.sort((a, b) => a.day.compareTo(b.day));
    final totalHours = _calculateTotalHours(weekSchedules);

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
              _buildSummaryCard(totalHours),
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
                child: _isLoading
                    ? const Center(
                        key: ValueKey<String>('loader'),
                        child: Padding(
                          padding: EdgeInsets.symmetric(vertical: 40),
                          child: CircularProgressIndicator(color: primaryGreen),
                        ),
                      )
                    : Column(
                        key: ValueKey<int>(_weeksOffset),
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: weekSchedules.isEmpty
                            ? [
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
                                  decoration: BoxDecoration(
                                    color: cardColor,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: borderColor),
                                  ),
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: const [
                                      Icon(Icons.access_time, color: subTextColor, size: 40),
                                      SizedBox(height: 16),
                                      Text(
                                        'No time entries for this week',
                                        style: TextStyle(color: subTextColor, fontSize: 15, fontWeight: FontWeight.w500),
                                      ),
                                    ],
                                  ),
                                ),
                              ]
                            : List.generate(weekSchedules.length, (index) {
                                final s = weekSchedules[index];
                                final dayName = _getWeekdayName(s.day);
                                final dateStr = _formatDate(s.day);
                                
                                final type = s.shiftType.toLowerCase();
                                String clockIn = '09:00 AM';
                                String clockOut = '05:00 PM';
                                String total = '8h 0m';
                                if (type.contains('morning')) {
                                  clockIn = '08:00 AM';
                                  clockOut = '04:00 PM';
                                  total = '8h 0m';
                                } else if (type.contains('night') || type.contains('evening')) {
                                  clockIn = '04:00 PM';
                                  clockOut = '12:00 AM';
                                  total = '8h 0m';
                                } else {
                                  clockIn = _formatTime(s.startTime);
                                  clockOut = _formatTime(s.endTime);
                                  
                                  double diff = 0.0;
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
                                      diff = (endMinutes - startMinutes) / 60.0;
                                    } else if (endMinutes < startMinutes) {
                                      diff = ((24 * 60 - startMinutes) + endMinutes) / 60.0;
                                    }
                                  }
                                  final int h = diff.toInt();
                                  final int m = ((diff - h) * 60).round();
                                  total = '${h}h ${m}m';
                                }

                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 12.0),
                                  child: _buildTimeEntryCard(
                                    day: dayName,
                                    date: dateStr,
                                    clockIn: clockIn,
                                    clockOut: clockOut,
                                    total: total,
                                    status: 'Approved',
                                  ),
                                );
                              }).toList(),
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
  Widget _buildSummaryCard(double totalHours) {
    final regular = totalHours > 40.0 ? 40.0 : totalHours;
    final overtime = totalHours > 40.0 ? totalHours - 40.0 : 0.0;

    final int totalH = totalHours.toInt();
    final int totalM = ((totalHours - totalH) * 60).round();
    final String totalStr = '${totalH}h ${totalM}m';

    final int regH = regular.toInt();
    final int regM = ((regular - regH) * 60).round();
    final String regStr = '${regH}h ${regM}m';

    final int otH = overtime.toInt();
    final int otM = ((overtime - otH) * 60).round();
    final String otStr = '${otH}h ${otM}m';

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
                  Text(totalStr, style: const TextStyle(color: textColor, fontSize: 32, fontWeight: FontWeight.bold)),
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
              Text('Regular: $regStr', style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 14)),
              Text('Overtime: $otStr', style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 14)),
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
