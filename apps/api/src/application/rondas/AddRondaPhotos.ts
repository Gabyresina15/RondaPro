import { randomUUID } from 'node:crypto';
import type { Ronda } from '../../domain/entities/Ronda.js';
import type { PhotoStorage } from '../../domain/ports/PhotoStorage.js';
import type { RondaRepository } from '../../domain/ports/RondaRepository.js';
import { RondaAlreadyCompletedError } from './SaveRondaAnswers.js';
import { RondaNotFoundError } from './GetRonda.js';

export class InvalidPhotoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPhotoError';
  }
}

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 4 * 1024 * 1024;

export interface IncomingPhoto {
  filename: string;
  mimeType: string;
  dataBase64: string;
  itemIndex?: number;
}

export class AddRondaPhotos {
  constructor(
    private readonly rondas: RondaRepository,
    private readonly storage: PhotoStorage,
  ) {}

  async execute(
    id: string,
    ownerId: string,
    incoming: IncomingPhoto[],
  ): Promise<Ronda> {
    const existing = await this.rondas.findById(id);
    if (!existing || existing.ownerId !== ownerId) {
      throw new RondaNotFoundError(id);
    }
    if (existing.status === 'completed') {
      throw new RondaAlreadyCompletedError(id);
    }
    if (incoming.length === 0) {
      throw new InvalidPhotoError('At least one photo is required');
    }

    const stored = [];
    for (const photo of incoming) {
      if (!ALLOWED_MIME.has(photo.mimeType)) {
        throw new InvalidPhotoError(
          `Unsupported mime type: ${photo.mimeType}`,
        );
      }
      const bytes = decodeBase64(photo.dataBase64);
      if (bytes.length === 0 || bytes.length > MAX_BYTES) {
        throw new InvalidPhotoError(
          `Photo ${photo.filename} must be between 1 byte and 4MB`,
        );
      }
      const photoId = randomUUID();
      const saved = await this.storage.save({
        ownerId,
        rondaId: id,
        photoId,
        filename: photo.filename,
        mimeType: photo.mimeType,
        bytes,
      });
      stored.push({
        id: photoId,
        filename: photo.filename,
        mimeType: photo.mimeType,
        relativePath: saved.relativePath,
        itemIndex: photo.itemIndex,
        createdAt: new Date(),
      });
    }

    const updated = await this.rondas.addPhotos(id, ownerId, stored);
    if (!updated) {
      throw new RondaAlreadyCompletedError(id);
    }
    return updated;
  }
}

function decodeBase64(value: string): Buffer {
  const cleaned = value.includes(',') ? value.slice(value.indexOf(',') + 1) : value;
  try {
    return Buffer.from(cleaned, 'base64');
  } catch {
    throw new InvalidPhotoError('Invalid base64 photo payload');
  }
}
