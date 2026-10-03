import 'dart:typed_data';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:share_plus/share_plus.dart';

import 'share_ronda_pdf_io.dart' if (dart.library.html) 'share_ronda_pdf_web.dart';

String rondaPdfFilename(String rondaId) {
  final short = rondaId.length > 6 ? rondaId.substring(rondaId.length - 6) : rondaId;
  return 'rondapro-$short.pdf';
}

Future<void> shareRondaPdf({
  required List<int> bytes,
  required String rondaId,
  required String text,
}) async {
  final name = rondaPdfFilename(rondaId);
  final XFile file;
  if (kIsWeb) {
    file = XFile.fromData(
      Uint8List.fromList(bytes),
      mimeType: 'application/pdf',
      name: name,
    );
  } else {
    file = await writeTempPdf(bytes, name);
  }
  await SharePlus.instance.share(
    ShareParams(files: [file], text: text, subject: name),
  );
}
