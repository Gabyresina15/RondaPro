import { z } from 'zod';

export const createSiteBodySchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().max(400).default(''),
  notes: z.string().max(2000).default(''),
  parentId: z.string().min(1).optional(),
});

export const updateSiteBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    address: z.string().max(400).optional(),
    notes: z.string().max(2000).optional(),
    parentId: z.string().min(1).nullable().optional(),
  })
  .refine(
    (body) =>
      body.name !== undefined ||
      body.address !== undefined ||
      body.notes !== undefined ||
      body.parentId !== undefined,
    { message: 'At least one field must be provided' },
  );

export const siteIdParamsSchema = z.object({
  id: z.string().min(1),
});
