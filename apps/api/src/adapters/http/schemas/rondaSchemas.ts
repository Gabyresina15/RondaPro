import { z } from 'zod';

export const startRondaBodySchema = z.object({
  templateId: z.string().min(1),
  location: z.string().max(200).default(''),
  siteId: z.string().min(1).optional(),
});

export const addFindingBodySchema = z.object({
  title: z.string().min(1).max(200),
  notes: z.string().max(2000).default(''),
  severity: z.enum(['low', 'medium', 'high']).default('medium'),
  itemIndex: z.number().int().min(0).optional(),
});

export const findingParamsSchema = z.object({
  id: z.string().min(1),
  findingId: z.string().min(1),
});

export const rondaIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const rondaPhotoParamsSchema = z.object({
  id: z.string().min(1),
  photoId: z.string().min(1),
});

export const rondaAnswerSchema = z.object({
  itemIndex: z.number().int().min(0),
  label: z.string().min(1).max(500),
  type: z.enum(['text', 'bool', 'photo']),
  textValue: z.string().max(4000).optional(),
  boolValue: z.boolean().optional(),
});

export const saveAnswersBodySchema = z.object({
  answers: z.array(rondaAnswerSchema).min(1),
});

export const addPhotosBodySchema = z.object({
  photos: z
    .array(
      z.object({
        filename: z.string().min(1).max(200),
        mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
        dataBase64: z.string().min(8),
        itemIndex: z.number().int().min(0).optional(),
      }),
    )
    .min(1)
    .max(8),
});
