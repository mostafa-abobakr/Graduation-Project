import 'package:flutter/material.dart';

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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: SingleChildScrollView(
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
              const CircleAvatar(
                radius: 30,
                backgroundColor: primaryGreen,
                child: Text('JD', style: TextStyle(color: textColor, fontSize: 20, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text('John Doe', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                  SizedBox(height: 4),
                  Text('Server', style: TextStyle(color: subTextColor, fontSize: 14)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          Divider(color: borderColor, height: 1),
          const SizedBox(height: 16),
          Row(
            children: const [
              Icon(Icons.location_on_outlined, color: subTextColor, size: 18),
              SizedBox(width: 8),
              Text('Bella\'s Kitchen', style: TextStyle(color: subTextColor, fontSize: 14)),
            ],
          ),
        ],
      ),
    );
  }

  // قسم المعلومات الشخصية (الإيميل والهاتف)
  Widget _buildPersonalInfoSection() {
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
            subtitle: 'john.doe@example.com',
          ),
          Divider(color: borderColor, height: 1),
          _buildInfoItem(
            icon: Icons.phone_outlined,
            title: 'Phone',
            subtitle: '+1 (555) 123-4567',
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
          _buildSettingsItem(icon: Icons.notifications_none, title: 'Notifications'),
          Divider(color: borderColor, height: 1),
          _buildSettingsItem(icon: Icons.shield_outlined, title: 'Privacy & Security'),
          Divider(color: borderColor, height: 1),
          _buildSettingsItem(icon: Icons.person_outline, title: 'Account Settings'),
        ],
      ),
    );
  }

  // ويدجت مساعدة لعنصر الإعدادات
  Widget _buildSettingsItem({required IconData icon, required String title}) {
    return Padding(
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
    );
  }

  // زر تسجيل الخروج
  Widget _buildSignOutButton(BuildContext context) {
    return GestureDetector(
      onTap: () {
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
