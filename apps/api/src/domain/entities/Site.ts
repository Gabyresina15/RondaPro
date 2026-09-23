export interface Site {
  id: string;
  name: string;
  address: string;
  notes: string;
  ownerId: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}
