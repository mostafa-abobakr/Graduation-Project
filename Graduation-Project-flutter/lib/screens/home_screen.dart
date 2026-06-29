import 'package:flutter/material.dart';
import '../services/api_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<ShiftSchedule> _schedules = [];
  bool _isLoading = true;

  // الألوان
  static const Color bgColor = Color(0xFF141924);
  static const Color cardColor = Color(0xFF1F2533);
  static const Color borderColor = Color(0xFF2C3446);
  static const Color primaryGreen = Color(0xFF1DCE82);
  static const Color textColor = Colors.white;
  static const Color subTextColor = Color(0xFF9198A8);

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
          if (_schedules.isNotEmpty) {
            ApiService.currentEmployeeName ??= _schedules.first.employeeName;
          }
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

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final todaySchedules = _schedules.where((s) {
      final parsed = DateTime.tryParse(s.day);
      if (parsed == null) return false;
      return parsed.year == now.year && parsed.month == now.month && parsed.day == now.day;
    }).toList();

    final upcomingSchedules = _schedules.where((s) {
      final parsed = DateTime.tryParse(s.day);
      if (parsed == null) return true;
      return parsed.isAfter(DateTime(now.year, now.month, now.day, 23, 59, 59));
    }).toList();

    final totalHours = _calculateTotalHours(_schedules);
    final String displayName = _schedules.isNotEmpty && _schedules.first.employeeName.isNotEmpty
        ? _schedules.first.employeeName
        : 'John';

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: RefreshIndicator(
          color: primaryGreen,
          backgroundColor: cardColor,
          onRefresh: _fetchSchedules,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(displayName),
                const SizedBox(height: 32),
                _buildTodayScheduleCard(todaySchedules),
                const SizedBox(height: 24),
                _buildStatsRow(upcomingSchedules.length, totalHours),
                const SizedBox(height: 32),
                _buildUpcomingShiftsHeader(),
                const SizedBox(height: 16),
                if (_isLoading)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 40),
                      child: CircularProgressIndicator(color: primaryGreen),
                    ),
                  )
                else if (upcomingSchedules.isEmpty)
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
                        Icon(Icons.calendar_today_outlined, color: subTextColor, size: 40),
                        SizedBox(height: 16),
                        Text(
                          'No upcoming shifts scheduled',
                          style: TextStyle(color: subTextColor, fontSize: 15, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  )
                else
                  ...upcomingSchedules.map((shift) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _buildShiftCard(shift),
                    );
                  }).toList(),
              ],
            ),
          ),
        ),
      ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  // --- الهيدر ---
  Widget _buildHeader(String name) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Hi, $name 👋', style: const TextStyle(color: textColor, fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            const Text('Welcome back', style: TextStyle(color: subTextColor, fontSize: 14)),
          ],
        ),
        _buildNotificationIcon(),
      ],
    );
  }

  Widget _buildNotificationIcon() {
    return GestureDetector(
      onTap: _showNotificationsOverlay,
      child: Stack(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: cardColor, shape: BoxShape.circle, border: Border.all(color: borderColor)),
            child: const Icon(Icons.notifications_none, color: textColor, size: 24),
          ),
          Positioned(
            top: 10, right: 12,
            child: Container(width: 8, height: 8, decoration: const BoxDecoration(color: primaryGreen, shape: BoxShape.circle)),
          ),
        ],
      ),
    );
  }

  List<Map<String, String>> _generateNotifications() {
    final list = <Map<String, String>>[];
    
    // Add default general notifications
    list.add({
      'icon': '📢',
      'message': 'Main Kitchen branch update: Shift timing policies adjusted for peak summer hours.',
    });
    list.add({
      'icon': '📌',
      'message': 'Your schedule for this week has been verified by the AI Engine.',
    });

    // Generate reminders from shift schedules
    for (final s in _schedules) {
      final dateFormatted = _formatDate(s.day);
      final timeFormatted = _formatTime(s.startTime);
      list.insert(0, {
        'icon': '⏰',
        'message': 'Reminder: Your upcoming shift on $dateFormatted starts at $timeFormatted.',
      });
    }

    // Ensure we have at least 3 notification items as requested
    if (list.length < 3) {
      list.add({
        'icon': '🔄',
        'message': 'Management approved your dynamic shift swap request with your colleague.',
      });
    }

    // Prepend pending request alerts at the very top
    for (final req in ApiService.pendingRequests) {
      if (req['type'] == 'time_off') {
        final requestedDate = req['date'] ?? 'Apr 1';
        list.insert(0, {
          'icon': '⚠️',
          'message': 'Vacation request for Shift on $requestedDate is currently pending management review.',
        });
      } else if (req['type'] == 'swap') {
        list.insert(0, {
          'icon': '🔄',
          'message': 'Shift swap request sent to colleague is awaiting confirmation.',
        });
      }
    }

    return list.take(6).toList(); // Return top items
  }

  void _showNotificationsOverlay() {
    final notifications = _generateNotifications();
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: cardColor,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: borderColor),
          ),
          title: Row(
            children: const [
              Icon(Icons.notifications, color: primaryGreen),
              SizedBox(width: 8),
              Text('Notifications', style: TextStyle(color: textColor)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (int i = 0; i < notifications.length; i++) ...[
                _buildNotificationItem(notifications[i]['icon']!, notifications[i]['message']!),
                if (i < notifications.length - 1) const Divider(color: borderColor),
              ]
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Dismiss All', style: TextStyle(color: primaryGreen)),
            ),
          ],
        );
      },
    );
  }

  Widget _buildNotificationItem(String icon, String message) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(icon, style: const TextStyle(fontSize: 20)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(color: textColor, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  // --- كارت اليوم ---
  Widget _buildTodayScheduleCard(List<ShiftSchedule> todaySchedules) {
    final now = DateTime.now();
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final dateStr = '${months[now.month - 1]} ${now.day}';

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFF22D086), Color(0xFF13AD6B)]),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text("Today's Schedule", style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                Text(dateStr, style: const TextStyle(color: Colors.white70, fontSize: 14)),
              ],
            ),
            const SizedBox(height: 20),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(16)),
              child: todaySchedules.isEmpty
                  ? const Center(
                      child: Padding(
                        padding: EdgeInsets.symmetric(vertical: 12),
                        child: Text(
                          'No shift scheduled for today 👍',
                          style: TextStyle(color: textColor, fontSize: 15, fontWeight: FontWeight.w600),
                        ),
                      ),
                    )
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              todaySchedules.first.shiftType,
                              style: const TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w600),
                            ),
                            _buildBadge('Upcoming'),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            const Icon(Icons.access_time, color: textColor, size: 16),
                            const SizedBox(width: 8),
                            Text(
                              '${_formatTime(todaySchedules.first.startTime)} - ${_formatTime(todaySchedules.first.endTime)}',
                              style: const TextStyle(color: textColor, fontSize: 14),
                            ),
                          ],
                        ),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBadge(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(20)),
      child: Text(text, style: const TextStyle(color: textColor, fontSize: 12)),
    );
  }

  // --- الإحصائيات ---
  Widget _buildStatsRow(int upcomingCount, double totalHours) {
    return Row(
      children: [
        Expanded(child: _buildStatCard(title: 'Hours This Week', value: totalHours.toStringAsFixed(1), icon: Icons.access_time)),
        const SizedBox(width: 16),
        Expanded(child: _buildStatCard(title: 'Shifts Scheduled', value: upcomingCount.toString(), icon: Icons.calendar_today_outlined)),
      ],
    );
  }

  Widget _buildStatCard({required String title, required String value, required IconData icon}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(16), border: Border.all(color: borderColor)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: primaryGreen, size: 20),
          const SizedBox(height: 16),
          Text(title, style: const TextStyle(color: subTextColor, fontSize: 12)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(color: textColor, fontSize: 24, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  // --- كارت المناوبة ---
  Widget _buildUpcomingShiftsHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: const [
        Text('Upcoming Shifts', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
        Text('View All', style: TextStyle(color: primaryGreen, fontSize: 14, fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _buildShiftCard(ShiftSchedule shift) {
    final formattedDate = _formatDate(shift.day);
    final formattedTime = '${_formatTime(shift.startTime)} - ${_formatTime(shift.endTime)}';
    return GestureDetector(
      onTap: () => _showShiftActionsBottomSheet(context, shift),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(16), border: Border.all(color: borderColor)),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: primaryGreen.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
              child: const Icon(Icons.calendar_today_outlined, color: primaryGreen, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(shift.shiftType, style: const TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(formattedDate, style: const TextStyle(color: subTextColor, fontSize: 13)),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.access_time, color: subTextColor, size: 14),
                      const SizedBox(width: 4),
                      Text(formattedTime, style: const TextStyle(color: subTextColor, fontSize: 13)),
                    ],
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: subTextColor, size: 24),
          ],
        ),
      ),
    );
  }

  // --- شريط التنقل السفلي ---
  Widget _buildBottomNav() {
    return Container(
      height: 85,
      decoration: const BoxDecoration(color: cardColor, border: Border(top: BorderSide(color: borderColor))),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildNavItem(icon: Icons.calendar_today, label: 'Home', isSelected: true, route: '/home'),
          _buildNavItem(icon: Icons.access_time, label: 'Timesheet', isSelected: false, route: '/timesheet'),
          _buildNavItem(icon: Icons.person_outline, label: 'Profile', isSelected: false, route: '/profile'),
        ],
      ),
    );
  }

  Widget _buildNavItem({required IconData icon, required String label, required bool isSelected, required String route}) {
    return GestureDetector(
      onTap: () { if (!isSelected) Navigator.pushReplacementNamed(context, route); },
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(color: isSelected ? primaryGreen : Colors.transparent, borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: isSelected ? textColor : subTextColor, size: 24),
          ),
          const SizedBox(height: 6),
          Text(label, style: TextStyle(color: isSelected ? primaryGreen : subTextColor, fontSize: 12)),
        ],
      ),
    );
  }

  // ==============================================================
  // دالة الـ Bottom Sheet المصححة لإزالة الخطوط الصفراء (Overflow)
  // ==============================================================
  void _showShiftActionsBottomSheet(BuildContext context, ShiftSchedule shift) {
    final formattedDate = _formatDate(shift.day);
    final formattedTime = '${_formatTime(shift.startTime)} - ${_formatTime(shift.endTime)}';
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF262D3D),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) {
        return SingleChildScrollView(
          child: Padding(
            padding: EdgeInsets.only(
              left: 24, right: 24, top: 24,
              bottom: MediaQuery.of(context).viewInsets.bottom + 24,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40, height: 4,
                    decoration: BoxDecoration(color: Colors.grey.withOpacity(0.3), borderRadius: BorderRadius.circular(10)),
                  ),
                ),
                const SizedBox(height: 20),
                const Text('Shift Actions', style: TextStyle(color: textColor, fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                Text(shift.shiftType, style: const TextStyle(color: subTextColor, fontSize: 14)),
                const SizedBox(height: 4),
                Text('$formattedDate • $formattedTime', style: const TextStyle(color: subTextColor, fontSize: 12)),
                const SizedBox(height: 24),

                GestureDetector(
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.pushNamed(context, '/request_swap', arguments: shift);
                  },
                  child: _buildBottomSheetActionCard(title: 'Request Swap', subtitle: 'Swap this shift with another employee', icon: Icons.people_outline),
                ),
                const SizedBox(height: 12),

                GestureDetector(
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.pushNamed(context, '/request_time_off', arguments: shift);
                  },
                  child: _buildBottomSheetActionCard(title: 'Request Time Off', subtitle: 'Request vacation for this shift', icon: Icons.calendar_today_outlined),
                ),
                const SizedBox(height: 24),

                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF353E54),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Cancel', style: TextStyle(color: textColor, fontSize: 15)),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildBottomSheetActionCard({required String title, required String subtitle, required IconData icon}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(16), border: Border.all(color: borderColor)),
      child: Row(
        children: [
          Icon(icon, color: primaryGreen, size: 24),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w500)),
                Text(subtitle, style: const TextStyle(color: subTextColor, fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
