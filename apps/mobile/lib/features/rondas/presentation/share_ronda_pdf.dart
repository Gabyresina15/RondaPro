import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

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
  final dir = await getTemporaryDirectory();
  final file = File('${dir.path}/$name');
  await file.writeAsBytes(bytes, flush: true);
  await SharePlus.instance.share(
    ShareParams(
      files: [
        XFile(file.path, mimeType: 'application/pdf', name: name),
      ],
      text: text,
      subject: name,
    ),
  );
}
