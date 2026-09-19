import { z } from 'zod';

export const createSiteBodySchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().max(400).default(''),
  notes: z.string().max(2000).default(''),
});

export const updateSiteBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    address: z.string().max(400).optional(),
    notes: z.string().max(2000).optional(),
  })
  .refine(
    (body) =>
      body.name !== undefined ||
      body.address !== undefined ||
      body.notes !== undefined,
    { message: 'At least one field must be provided' },
  );

export const siteIdParamsSchema = z.object({
  id: z.string().min(1),
});
