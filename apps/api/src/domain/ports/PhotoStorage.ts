export interface StoredPhoto {
  relativePath: string;
}

export interface PhotoStorage {
  save(input: {
    ownerId: string;
    rondaId: string;
    photoId: string;
    filename: string;
    mimeType: string;
    bytes: Buffer;
  }): Promise<StoredPhoto>;
  read(relativePath: string): Promise<Buffer>;
}
