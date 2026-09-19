import type { Site } from '../../domain/entities/Site.js';
import type {
  CreateSiteInput,
  SiteRepository,
  UpdateSiteInput,
} from '../../domain/ports/SiteRepository.js';
import { SiteModel, type SiteDocument } from './SiteModel.js';

function toDomain(doc: SiteDocument): Site {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    address: doc.address,
    notes: doc.notes,
    ownerId: String(doc.ownerId),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongoSiteRepository implements SiteRepository {
  async create(input: CreateSiteInput): Promise<Site> {
    const doc = await SiteModel.create(input);
    return toDomain(doc as SiteDocument);
  }

  async findByOwner(ownerId: string): Promise<Site[]> {
    const docs = await SiteModel.find({ ownerId }).sort({ name: 1 }).exec();
    return docs.map((d) => toDomain(d as SiteDocument));
  }

  async findById(id: string): Promise<Site | null> {
    const doc = await SiteModel.findById(id).exec();
    return doc ? toDomain(doc as SiteDocument) : null;
  }

  async update(
    id: string,
    ownerId: string,
    input: UpdateSiteInput,
  ): Promise<Site | null> {
    const doc = await SiteModel.findOneAndUpdate(
      { _id: id, ownerId },
      { $set: input },
      { new: true },
    ).exec();
    return doc ? toDomain(doc as SiteDocument) : null;
  }

  async delete(id: string, ownerId: string): Promise<boolean> {
    const result = await SiteModel.deleteOne({ _id: id, ownerId }).exec();
    return result.deletedCount === 1;
  }
}
