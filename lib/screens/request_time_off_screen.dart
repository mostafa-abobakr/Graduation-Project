import 'package:flutter/material.dart';

class RequestTimeOffScreen extends StatefulWidget {
  const RequestTimeOffScreen({super.key});

  @override
  State<RequestTimeOffScreen> createState() => _RequestTimeOffScreenState();
}

class _RequestTimeOffScreenState extends State<RequestTimeOffScreen> {
  // نفس الألوان المتناسقة
  static const Color bgColor = Color(0xFF141924);
  static const Color cardColor = Color(0xFF1F2533);
  static const Color borderColor = Color(0xFF2C3446);
  static const Color primaryGreen = Color(0xFF1DCE82);
  static const Color textColor = Colors.white;
  static const Color subTextColor = Color(0xFF9198A8);

  // الخيار رقم 2 (Personal Day) هو المحدد بشكل افتراضي كما في الصورة
  int? _selectedIndex = 2;

  // قائمة أسباب الإجازة (مزيج من Emojis وأيقونات)
  final List<Map<String, dynamic>> _reasons = [
    {'title': 'Vacation', 'icon': '🏖️', 'isEmoji': true},
    {'title': 'Sick Leave', 'icon': '🤒', 'isEmoji': true},
    {'title': 'Personal Day', 'icon': Icons.person, 'isEmoji': false},
    {'title': 'Family Emergency', 'icon': '👨‍👩‍👧‍👦', 'isEmoji': true},
    {'title': 'Other', 'icon': '📝', 'isEmoji': true},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Column(
          children: [
            // الهيدر (العنوان وزر الرجوع - أضفته لكي تستطيع العودة)
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
                    'Request Time Off',
                    style: TextStyle(color: textColor, fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),

            // المحتوى الأساسي القابل للتمرير
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 16),

                    // كارت تفاصيل المناوبة
                    _buildShiftCard(),
                    const SizedBox(height: 32),

                    const Text('Select Reason', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),

                    // توليد خيارات أسباب الإجازة
                    ...List.generate(_reasons.length, (index) {
                      return _buildReasonCard(index);
                    }),

                    const SizedBox(height: 24),
                    const Text('Additional Notes (Optional)', style: TextStyle(color: subTextColor, fontSize: 13)),
                    const SizedBox(height: 8),

                    // حقل الملاحظات
                    _buildNotesField(),

                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),

      // الزر السفلي (يتفعل إذا كان هناك اختيار)
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
            onPressed: _selectedIndex != null
                ? () {
              // إرسال الطلب
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Time Off request submitted!')),
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
              'Submit Request',
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

  // كارت المناوبة
  Widget _buildShiftCard() {
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
          Text('Requesting Time Off For', style: TextStyle(color: subTextColor, fontSize: 13)),
          SizedBox(height: 8),
          Text('Evening Shift', style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w600)),
          SizedBox(height: 4),
          Text('Tomorrow • Apr 1 • 02:00 PM - 10:00 PM', style: TextStyle(color: subTextColor, fontSize: 13)),
        ],
      ),
    );
  }

  // كارت خيار الإجازة
  Widget _buildReasonCard(int index) {
    bool isSelected = _selectedIndex == index;
    final reason = _reasons[index];

    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedIndex = index;
        });
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? primaryGreen : borderColor,
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Row(
          children: [
            // المربع الأخضر الداكن الذي يحتوي على الإيموجي أو الأيقونة
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: primaryGreen.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: reason['isEmoji']
                  ? Text(reason['icon'], style: const TextStyle(fontSize: 20))
                  : Icon(reason['icon'], color: Colors.blueGrey[300], size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                reason['title'],
                style: const TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w500),
              ),
            ),
            // علامة التحديد (Radio Button Style)
            if (isSelected)
              Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: primaryGreen, width: 2),
                ),
                child: Center(
                  child: Container(
                    width: 10,
                    height: 10,
                    decoration: const BoxDecoration(
                      color: primaryGreen,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  // حقل الملاحظات الإضافية
  Widget _buildNotesField() {
    return TextField(
      maxLines: 4, // يجعله كبيراً ليسع 4 أسطر
      style: const TextStyle(color: textColor, fontSize: 15),
      decoration: InputDecoration(
        hintText: 'Provide any additional details...',
        hintStyle: TextStyle(color: subTextColor.withOpacity(0.5), fontSize: 15),
        filled: true,
        fillColor: cardColor,
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
}
