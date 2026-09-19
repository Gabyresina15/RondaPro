import type { PhotoStorage } from '../../domain/ports/PhotoStorage.js';
import type { RondaRepository } from '../../domain/ports/RondaRepository.js';
import { RondaNotFoundError } from './GetRonda.js';

export class PhotoNotFoundError extends Error {
  constructor(id: string) {
    super(`Photo not found: ${id}`);
    this.name = 'PhotoNotFoundError';
  }
}

export class GetRondaPhoto {
  constructor(
    private readonly rondas: RondaRepository,
    private readonly storage: PhotoStorage,
  ) {}

  async execute(
    rondaId: string,
    photoId: string,
    ownerId: string,
  ): Promise<{ bytes: Buffer; mimeType: string; filename: string }> {
    const ronda = await this.rondas.findById(rondaId);
    if (!ronda || ronda.ownerId !== ownerId) {
      throw new RondaNotFoundError(rondaId);
    }
    const photo = ronda.photos.find((p) => p.id === photoId);
    if (!photo) {
      throw new PhotoNotFoundError(photoId);
    }
    const bytes = await this.storage.read(photo.relativePath);
    return { bytes, mimeType: photo.mimeType, filename: photo.filename };
  }
}
