import type { User } from '../../domain/entities/User.js';
import type {
  CreateUserInput,
  UserRepository,
} from '../../domain/ports/UserRepository.js';
import { UserModel, type UserDocument } from './UserModel.js';

function toDomain(doc: UserDocument): User {
  return {
    id: doc._id.toHexString(),
    email: doc.email,
    passwordHash: doc.passwordHash,
    name: doc.name,
    createdAt: doc.createdAt,
  };
}

export class MongoUserRepository implements UserRepository {
  async create(input: CreateUserInput): Promise<User> {
    const doc = await UserModel.create({
      email: input.email,
      passwordHash: input.passwordHash,
      name: input.name,
    });
    return toDomain(doc as UserDocument);
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email: email.toLowerCase() }).exec();
    return doc ? toDomain(doc as UserDocument) : null;
  }

  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id).exec();
    return doc ? toDomain(doc as UserDocument) : null;
  }
}
