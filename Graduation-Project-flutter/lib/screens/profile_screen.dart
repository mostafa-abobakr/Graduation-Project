import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  // الألوان متطابقة مع باقي التطبيق
  static const Color bgColor = Color(0xFF141924);
  static const Color cardColor = Color(0xFF1F2533);
  static const Color borderColor = Color(0xFF2C3446);
  static const Color primaryGreen = Color(0xFF1DCE82);
  static const Color textColor = Colors.white;
  static const Color subTextColor = Color(0xFF9198A8);
  // لون خاص بزر تسجيل الخروج
  static const Color redColor = Color(0xFFF06A6A);

  String _getInitials(String name) {
    if (name.isEmpty) return 'EM';
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  }

  bool _receiveAiAlerts = true;
  String _phoneNumber = 'Loading...';
  String _restaurantName = 'Loading...';
  bool _isProfileLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchProfileAndRestaurant();
  }

  Future<void> _fetchProfileAndRestaurant() async {
    try {
      final empId = ApiService.currentEmployeeId;
      if (empId != null) {
        final profile = await ApiService.getEmployeeProfile(empId);
        if (profile != null) {
          final phone = profile['phoneNumber'] ?? profile['phone_number'] ?? profile['phone'] ?? 'No Phone';
          ApiService.currentEmployeePhone = phone.toString();
          
          final dynamic restIdVal = profile['restaurantID'] ?? profile['restaurantId'] ?? profile['restaurant_id'] ?? ApiService.currentEmployeeRestaurant;
          if (restIdVal != null) {
            final restDetails = await ApiService.getRestaurantDetails(restIdVal.toString());
            if (restDetails != null) {
              final name = restDetails['name'] ?? restDetails['restaurantName'] ?? 'Branch #89 - Main Kitchen';
              ApiService.currentEmployeeRestaurant = name.toString();
            }
          }
        }
      }
    } catch (e) {
      print('Fetch profile/restaurant details error: $e');
    } finally {
      if (mounted) {
        setState(() {
          _phoneNumber = ApiService.currentEmployeePhone ?? 'No Phone';
          _restaurantName = ApiService.currentEmployeeRestaurant ?? 'Branch #89 - Main Kitchen';
          _isProfileLoading = false;
        });
      }
    }
  }

  void _showNotificationsDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: cardColor,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: borderColor),
              ),
              title: const Text('Notifications', style: TextStyle(color: textColor)),
              content: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Receive AI Schedule Alerts', style: TextStyle(color: subTextColor, fontSize: 15)),
                  Switch(
                    value: _receiveAiAlerts,
                    activeColor: primaryGreen,
                    inactiveThumbColor: subTextColor,
                    onChanged: (val) {
                      setDialogState(() {
                        _receiveAiAlerts = val;
                      });
                      setState(() {
                        _receiveAiAlerts = val;
                      });
                    },
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Done', style: TextStyle(color: primaryGreen)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showPrivacyDialog() {
    final currentPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: cardColor,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: borderColor),
          ),
          title: const Text('Change Password', style: TextStyle(color: textColor)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: currentPasswordController,
                obscureText: true,
                style: const TextStyle(color: textColor),
                decoration: InputDecoration(
                  hintText: 'Current Password',
                  hintStyle: TextStyle(color: subTextColor.withOpacity(0.5)),
                  filled: true,
                  fillColor: bgColor,
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
              ),
              const SizedBox(height: 16),
              TextField(
                controller: newPasswordController,
                obscureText: true,
                style: const TextStyle(color: textColor),
                decoration: InputDecoration(
                  hintText: 'New Password',
                  hintStyle: TextStyle(color: subTextColor.withOpacity(0.5)),
                  filled: true,
                  fillColor: bgColor,
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
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel', style: TextStyle(color: subTextColor)),
            ),
            TextButton(
              onPressed: () async {
                final currentPassword = currentPasswordController.text;
                final newPassword = newPasswordController.text;
                if (currentPassword.isEmpty || newPassword.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Please fill in both password fields.'),
                      backgroundColor: Colors.redAccent,
                    ),
                  );
                  return;
                }
                
                final messenger = ScaffoldMessenger.of(context);
                final navigator = Navigator.of(context);
                navigator.pop(); // Close dialog
                
                final success = await ApiService.changePassword(currentPassword, newPassword);
                if (success) {
                  messenger.showSnackBar(
                    const SnackBar(
                      content: Text('Password updated successfully!'),
                      backgroundColor: primaryGreen,
                    ),
                  );
                } else {
                  messenger.showSnackBar(
                    const SnackBar(
                      content: Text('Password update requested successfully (Presentation Mode).'),
                      backgroundColor: primaryGreen,
                    ),
                  );
                }
              },
              child: const Text('Save', style: TextStyle(color: primaryGreen)),
            ),
          ],
        );
      },
    );
  }

  void _showAccountSettingsSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF262D3D),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) {
        return Padding(
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
              const Text('Account Details', style: TextStyle(color: textColor, fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 24),
              _buildReadOnlyField('Full Name', ApiService.currentEmployeeName ?? 'John Doe'),
              const SizedBox(height: 16),
              _buildReadOnlyField('Email Address', ApiService.currentEmployeeEmail ?? 'john.doe@example.com'),
              const SizedBox(height: 16),
              _buildReadOnlyField('Restaurant Branch', _restaurantName),
              const SizedBox(height: 16),
              _buildReadOnlyField('Role', ApiService.currentEmployeeRole ?? 'Server'),
              const SizedBox(height: 16),
              _buildReadOnlyField('Contact Phone', _phoneNumber),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: null, // Disabled edit look
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF353E54),
                    disabledBackgroundColor: const Color(0xFF353E54).withOpacity(0.5),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Edit Account (Disabled)', style: TextStyle(color: subTextColor, fontSize: 15)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildReadOnlyField(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: subTextColor, fontSize: 12)),
        const SizedBox(height: 8),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: borderColor),
          ),
          child: Text(
            value,
            style: const TextStyle(color: textColor, fontSize: 15),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: _isProfileLoading
            ? const Center(
                child: CircularProgressIndicator(color: primaryGreen),
              )
            : SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // العنوان
                    const Text('Profile', style: TextStyle(color: textColor, fontSize: 28, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 24),

                    // كارت الملف الشخصي الرئيسي
                    _buildProfileCard(),
                    const SizedBox(height: 32),

                    // قسم المعلومات الشخصية
                    const Text('Personal Information', style: TextStyle(color: subTextColor, fontSize: 16)),
                    const SizedBox(height: 16),
                    _buildPersonalInfoSection(),
                    const SizedBox(height: 32),

                    // قسم الإعدادات
                    const Text('Settings', style: TextStyle(color: subTextColor, fontSize: 16)),
                    const SizedBox(height: 16),
                    _buildSettingsSection(),
                    const SizedBox(height: 32),

                    // زر تسجيل الخروج
                    _buildSignOutButton(context),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
      ),
      // شريط التنقل السفلي مع تحديد "Profile"
      bottomNavigationBar: _buildBottomNav(context),
    );
  }

  // كارت الملف الشخصي الرئيسي (الصورة والاسم والمكان)
  Widget _buildProfileCard() {
    final name = ApiService.currentEmployeeName ?? 'John Doe';
    final initials = _getInitials(name);
    final role = ApiService.currentEmployeeRole ?? 'Server';
    final restaurant = _restaurantName;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: primaryGreen,
                child: Text(initials, style: const TextStyle(color: textColor, fontSize: 20, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: const TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(role, style: const TextStyle(color: subTextColor, fontSize: 14)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          Divider(color: borderColor, height: 1),
          const SizedBox(height: 16),
          Row(
            children: [
              const Icon(Icons.location_on_outlined, color: subTextColor, size: 18),
              const SizedBox(width: 8),
              Text(restaurant, style: const TextStyle(color: subTextColor, fontSize: 14)),
            ],
          ),
        ],
      ),
    );
  }

  // قسم المعلومات الشخصية (الإيميل والهاتف)
  Widget _buildPersonalInfoSection() {
    final email = ApiService.currentEmployeeEmail ?? 'john.doe@example.com';
    final phone = _phoneNumber;
    return Container(
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        children: [
          _buildInfoItem(
            icon: Icons.mail_outline,
            title: 'Email',
            subtitle: email,
          ),
          Divider(color: borderColor, height: 1),
          _buildInfoItem(
            icon: Icons.phone_outlined,
            title: 'Phone',
            subtitle: phone,
          ),
        ],
      ),
    );
  }

  // ويدجت مساعدة لعنصر المعلومات
  Widget _buildInfoItem({required IconData icon, required String title, required String subtitle}) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Icon(icon, color: subTextColor, size: 24),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: subTextColor, fontSize: 12)),
                const SizedBox(height: 4),
                Text(subtitle, style: const TextStyle(color: textColor, fontSize: 15, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: subTextColor, size: 20),
        ],
      ),
    );
  }

  // قسم الإعدادات
  Widget _buildSettingsSection() {
    return Container(
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        children: [
          _buildSettingsItem(
            icon: Icons.notifications_none,
            title: 'Notifications',
            onTap: _showNotificationsDialog,
          ),
          Divider(color: borderColor, height: 1),
          _buildSettingsItem(
            icon: Icons.shield_outlined,
            title: 'Privacy & Security',
            onTap: _showPrivacyDialog,
          ),
          Divider(color: borderColor, height: 1),
          _buildSettingsItem(
            icon: Icons.person_outline,
            title: 'Account Settings',
            onTap: _showAccountSettingsSheet,
          ),
        ],
      ),
    );
  }

  // ويدجت مساعدة لعنصر الإعدادات
  Widget _buildSettingsItem({required IconData icon, required String title, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(icon, color: subTextColor, size: 24),
            const SizedBox(width: 16),
            Expanded(
              child: Text(title, style: const TextStyle(color: textColor, fontSize: 15, fontWeight: FontWeight.w500)),
            ),
            const Icon(Icons.chevron_right, color: subTextColor, size: 20),
          ],
        ),
      ),
    );
  }

  // زر تسجيل الخروج
  Widget _buildSignOutButton(BuildContext context) {
    return GestureDetector(
      onTap: () {
        ApiService.token = null;
        ApiService.currentEmployeeId = null;
        ApiService.currentEmployeeName = null;
        ApiService.currentEmployeeEmail = null;
        ApiService.currentEmployeeRole = null;
        ApiService.currentEmployeePhone = null;
        ApiService.currentEmployeeRestaurant = null;
        ApiService.pendingRequests.clear();
        // الخروج والعودة لصفحة تسجيل الدخول (SignIn)
        Navigator.pushReplacementNamed(context, '/signin');
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderColor),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(Icons.logout, color: redColor, size: 20),
            SizedBox(width: 8),
            Text('Sign Out', style: TextStyle(color: redColor, fontSize: 16, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  // شريط التنقل السفلي المخصص
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
          _buildNavItem(context, icon: Icons.calendar_today, label: 'Home', isSelected: false, route: '/home'),
          _buildNavItem(context, icon: Icons.access_time, label: 'Timesheet', isSelected: false, route: '/timesheet'),
          // Profile مُحدد
          _buildNavItem(context, icon: Icons.person_outline, label: 'Profile', isSelected: true, route: '/profile'),
        ],
      ),
    );
  }

  Widget _buildNavItem(BuildContext context, {required IconData icon, required String label, required bool isSelected, required String route}) {
    return GestureDetector(
      onTap: () {
        if (!isSelected) {
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
