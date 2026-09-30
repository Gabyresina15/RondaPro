import 'dart:typed_data';

import 'package:share_plus/share_plus.dart';

/// Shares (or downloads, on web) a PDF without touching dart:io / path_provider.
Future<void> shareRondaPdf({
  required List<int> bytes,
  required String rondaId,
  required String text,
}) {
  final name = 'rondapro-$rondaId.pdf';
  final file = XFile.fromData(
    Uint8List.fromList(bytes),
    mimeType: 'application/pdf',
    name: name,
  );
  return SharePlus.instance.share(
    ShareParams(
      files: [file],
      text: text,
      fileNameOverrides: [name],
    ),
  );
}
