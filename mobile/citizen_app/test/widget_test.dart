import 'package:citizen_app/main.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('Citizen app smoke test', (tester) async {
    await tester.pumpWidget(const CitizenApp());
    await tester.pump();
    expect(find.textContaining('Login'), findsWidgets);
  });
}
