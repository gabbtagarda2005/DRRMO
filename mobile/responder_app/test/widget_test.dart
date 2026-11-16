import 'package:flutter_test/flutter_test.dart';
import 'package:responder_app/main.dart';

void main() {
  testWidgets('Responder app smoke test', (tester) async {
    await tester.pumpWidget(const ResponderApp());
    await tester.pump();
    expect(find.textContaining('Login'), findsWidgets);
  });
}
