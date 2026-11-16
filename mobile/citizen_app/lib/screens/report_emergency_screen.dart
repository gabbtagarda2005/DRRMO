import 'package:drrmo_core/drrmo_core.dart';
import 'package:flutter/material.dart';

class ReportEmergencyScreen extends StatefulWidget {
  const ReportEmergencyScreen({super.key});

  @override
  State<ReportEmergencyScreen> createState() => _ReportEmergencyScreenState();
}

class _ReportEmergencyScreenState extends State<ReportEmergencyScreen> {
  int _step = 0;
  String _type = 'flood';
  final _description = TextEditingController();
  bool _useGps = true;

  static const _types = [
    ('flood', 'Flood', Icons.water_drop_outlined),
    ('fire', 'Fire', Icons.local_fire_department_outlined),
    ('accident', 'Accident', Icons.car_crash_outlined),
    ('medical', 'Medical', Icons.medical_services_outlined),
    ('earthquake', 'Earthquake', Icons.landscape_outlined),
    ('other', 'Other', Icons.more_horiz),
  ];

  @override
  void dispose() {
    _description.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const theme = DrrmoTheme.citizen;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        LinearProgressIndicator(
          value: (_step + 1) / 4,
          backgroundColor: const Color(0xFFE2E8F0),
          color: theme.primary,
          minHeight: 4,
          borderRadius: BorderRadius.circular(4),
        ),
        const SizedBox(height: 16),
        Text('Step ${_step + 1} of 4', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
        const SizedBox(height: 8),
        if (_step == 0) ...[
          const Text('Select emergency type', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          const SizedBox(height: 12),
          ..._types.map((t) {
            final selected = _type == t.$1;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: selected ? theme.primary : const Color(0xFFE2E8F0)),
                ),
                tileColor: selected ? const Color(0xFFFEE2E2) : Colors.white,
                leading: Icon(t.$3, color: theme.primary),
                title: Text(t.$2),
                onTap: () => setState(() => _type = t.$1),
              ),
            );
          }),
        ],
        if (_step == 1) ...[
          const Text('Describe the situation', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          const SizedBox(height: 12),
          TextField(
            controller: _description,
            maxLines: 5,
            decoration: const InputDecoration(hintText: 'What happened? Who is affected?'),
          ),
        ],
        if (_step == 2) ...[
          const Text('Attach media (simulated)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          const SizedBox(height: 12),
          Container(
            height: 140,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              border: Border.all(color: const Color(0xFFCBD5E1), style: BorderStyle.solid),
              borderRadius: BorderRadius.circular(12),
              color: const Color(0xFFF8FAFC),
            ),
            child: const Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.cloud_upload_outlined, size: 40, color: Color(0xFF94A3B8)),
                SizedBox(height: 8),
                Text('Tap to add photos or video', style: TextStyle(color: Color(0xFF64748B))),
              ],
            ),
          ),
        ],
        if (_step == 3) ...[
          const Text('Location', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          const SizedBox(height: 12),
          SwitchListTile(
            value: _useGps,
            onChanged: (v) => setState(() => _useGps = v),
            title: const Text('Share GPS location automatically'),
            subtitle: const Text('14.5995° N, 120.9842° E (simulated)'),
          ),
          Card(
            child: ListTile(
              leading: Icon(Icons.pin_drop_outlined, color: theme.primary),
              title: Text('Barangay San Jose'),
              subtitle: Text('Manila · Auto-detected'),
            ),
          ),
        ],
        const SizedBox(height: 24),
        Row(
          children: [
            if (_step > 0)
              Expanded(
                child: OutlinedButton(
                  onPressed: () => setState(() => _step--),
                  child: const Text('Back'),
                ),
              ),
            if (_step > 0) const SizedBox(width: 8),
            Expanded(
              flex: 2,
              child: FilledButton(
                onPressed: () {
                  if (_step < 3) {
                    setState(() => _step++);
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Emergency report submitted (demo)')),
                    );
                    setState(() {
                      _step = 0;
                      _description.clear();
                    });
                  }
                },
                child: Text(_step < 3 ? 'Continue' : 'Submit SOS report'),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
