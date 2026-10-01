import 'dart:typed_data';

import 'package:share_plus/share_plus.dart';

Future<void> shareRondaPdf({
  required List<int> bytes,
  required String rondaId,
  required String text,
}) {
  return SharePlus.instance.share(
    ShareParams(
      files: [
        XFile.fromData(
          Uint8List.fromList(bytes),
          mimeType: 'application/pdf',
          name: 'rondapro-${rondaId.length > 6 ? rondaId.substring(rondaId.length - 6) : rondaId}.pdf',
        ),
      ],
      text: text,
    ),
  );
}
