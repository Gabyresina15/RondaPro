import { z } from 'zod';

export const checklistItemSchema = z.object({
  label: z.string().min(1).max(500),
  required: z.boolean(),
  type: z.enum(['text', 'bool', 'photo']),
});

export const createTemplateBodySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).default(''),
  items: z.array(checklistItemSchema).default([]),
});

export const updateTemplateBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    items: z.array(checklistItemSchema).optional(),
  })
  .refine(
    (body) =>
      body.name !== undefined ||
      body.description !== undefined ||
      body.items !== undefined,
    { message: 'At least one field must be provided' },
  );

export const templateIdParamsSchema = z.object({
  id: z.string().min(1),
});

export type CreateTemplateBody = z.infer<typeof createTemplateBodySchema>;
export type UpdateTemplateBody = z.infer<typeof updateTemplateBodySchema>;
