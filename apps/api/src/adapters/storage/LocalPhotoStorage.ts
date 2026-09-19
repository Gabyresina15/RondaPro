import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { PhotoStorage, StoredPhoto } from '../../domain/ports/PhotoStorage.js';

export class LocalPhotoStorage implements PhotoStorage {
  constructor(private readonly rootDir: string) {}

  async save(input: {
    ownerId: string;
    rondaId: string;
    photoId: string;
    filename: string;
    mimeType: string;
    bytes: Buffer;
  }): Promise<StoredPhoto> {
    const ext = extensionFor(input.mimeType, input.filename);
    const relativePath = path.posix.join(
      input.ownerId,
      input.rondaId,
      `${input.photoId}${ext}`,
    );
    const absolute = path.join(this.rootDir, relativePath);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, input.bytes);
    return { relativePath };
  }

  async read(relativePath: string): Promise<Buffer> {
    const normalized = path
      .normalize(relativePath)
      .replace(/^(\.\.(\/|\\|$))+/, '');
    const absolute = path.join(this.rootDir, normalized);
    if (!absolute.startsWith(path.resolve(this.rootDir))) {
      throw new Error('Invalid photo path');
    }
    return readFile(absolute);
  }
}

function extensionFor(mimeType: string, filename: string): string {
  if (mimeType === 'image/jpeg') return '.jpg';
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/webp') return '.webp';
  const ext = path.extname(filename).toLowerCase();
  return ext || '.bin';
}
