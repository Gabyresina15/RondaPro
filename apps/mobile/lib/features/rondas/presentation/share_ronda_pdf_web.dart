import 'dart:typed_data';

import 'package:share_plus/share_plus.dart';

Future<XFile> writeTempPdf(List<int> bytes, String name) async {
  return XFile.fromData(
    Uint8List.fromList(bytes),
    mimeType: 'application/pdf',
    name: name,
  );
}
