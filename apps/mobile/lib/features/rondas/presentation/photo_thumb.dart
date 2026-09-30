import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/ronda_repository.dart';
import '../domain/ronda.dart';

class PhotoThumb extends StatelessWidget {
  const PhotoThumb({
    super.key,
    required this.rondaId,
    required this.photo,
    this.size = 72,
  });

  final String rondaId;
  final RondaPhoto photo;
  final double size;

  @override
  Widget build(BuildContext context) {
    final repo = context.read<RondaRepository>();
    return FutureBuilder<List<int>>(
      future: repo.photoBytes(rondaId, photo.id),
      builder: (context, snapshot) {
        Widget box(Widget child) {
          return ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: SizedBox(width: size, height: size, child: child),
          );
        }

        if (!snapshot.hasData) {
          return box(
            ColoredBox(
              color: Theme.of(context).colorScheme.surfaceContainerHighest,
              child: Center(
                child: snapshot.hasError
                    ? const Icon(Icons.broken_image_outlined, size: 20)
                    : const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
              ),
            ),
          );
        }
        final bytes = Uint8List.fromList(snapshot.data ?? const []);
        return box(
          Image.memory(
            bytes,
            width: size,
            height: size,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => ColoredBox(
              color: Theme.of(context).colorScheme.surfaceContainerHighest,
              child: const Center(
                child: Icon(Icons.broken_image_outlined, size: 20),
              ),
            ),
          ),
        );
      },
    );
  }
}
