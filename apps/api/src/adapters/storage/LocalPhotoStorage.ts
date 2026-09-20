import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { PhotoStorage, StoredPhoto } from '../../domain/ports/PhotoStorage.js';

export class LocalPhotoStorage implements PhotoStorage {
  constructor(private readonly rootDir: string) {}

  private root(): string {
    return path.resolve(this.rootDir);
  }

  private resolveSafe(relativePath: string): string {
    const normalized = path
      .normalize(relativePath.replace(/\\/g, '/'))
      .replace(/^(\.\.(\/|\\|$))+/, '');
    const absolute = path.resolve(this.root(), normalized);
    const root = this.root();
    const absCmp = process.platform === 'win32' ? absolute.toLowerCase() : absolute;
    const rootCmp = process.platform === 'win32' ? root.toLowerCase() : root;
    if (absCmp !== rootCmp && !absCmp.startsWith(`${rootCmp}${path.sep}`)) {
      throw new Error('Invalid photo path');
    }
    return absolute;
  }

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
    const absolute = this.resolveSafe(relativePath);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, input.bytes);
    return { relativePath };
  }

  async read(relativePath: string): Promise<Buffer> {
    return readFile(this.resolveSafe(relativePath));
  }
}

function extensionFor(mimeType: string, filename: string): string {
  if (mimeType === 'image/jpeg') return '.jpg';
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/webp') return '.webp';
  const ext = path.extname(filename).toLowerCase();
  return ext || '.bin';
}
