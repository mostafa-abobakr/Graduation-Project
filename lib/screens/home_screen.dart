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
        _schedules = list;
        _isLoading = false;
      });
    }
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
                _buildHeader(),
                const SizedBox(height: 32),
                _buildTodayScheduleCard(todaySchedules),
                const SizedBox(height: 24),
                _buildStatsRow(upcomingSchedules.length),
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
                    final formattedDate = _formatDate(shift.day);
                    final formattedTime = '${_formatTime(shift.startTime)} - ${_formatTime(shift.endTime)}';
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _buildShiftCard(
                        title: shift.shiftType,
                        date: formattedDate,
                        time: formattedTime,
                      ),
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
  Widget _buildHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text('Hi, John 👋', style: TextStyle(color: textColor, fontSize: 24, fontWeight: FontWeight.bold)),
            SizedBox(height: 4),
            Text('Welcome back', style: TextStyle(color: subTextColor, fontSize: 14)),
          ],
        ),
        _buildNotificationIcon(),
      ],
    );
  }

  Widget _buildNotificationIcon() {
    return Stack(
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
  Widget _buildStatsRow(int upcomingCount) {
    return Row(
      children: [
        Expanded(child: _buildStatCard(title: 'Hours This Week', value: '32.5', icon: Icons.access_time)),
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

  Widget _buildShiftCard({required String title, required String date, required String time}) {
    return GestureDetector(
      onTap: () => _showShiftActionsBottomSheet(context, title, date, time),
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
                  Text(title, style: const TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(date, style: const TextStyle(color: subTextColor, fontSize: 13)),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.access_time, color: subTextColor, size: 14),
                      const SizedBox(width: 4),
                      Text(time, style: const TextStyle(color: subTextColor, fontSize: 13)),
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
  void _showShiftActionsBottomSheet(BuildContext context, String title, String date, String time) {
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
                Text(title, style: const TextStyle(color: subTextColor, fontSize: 14)),
                const SizedBox(height: 4),
                Text('$date • $time', style: const TextStyle(color: subTextColor, fontSize: 12)),
                const SizedBox(height: 24),

                GestureDetector(
                  onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/request_swap'); },
                  child: _buildBottomSheetActionCard(title: 'Request Swap', subtitle: 'Swap this shift with another employee', icon: Icons.people_outline),
                ),
                const SizedBox(height: 12),

                GestureDetector(
                  onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/request_time_off'); },
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
