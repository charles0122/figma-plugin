import z from 'zod';

const deprecatedMetadataSchema = z.object({
  severity: z.enum(['warning', 'error']),
  message: z.string(),
  replacementToken: z.string().optional(),
  removeAfter: z.string().optional(),
});

const baseSchema = z.object({
  value: z.any(),
  type: z.string(),
  description: z.string().optional(),
  deprecated: z.union([z.boolean(), z.string()]).optional(),
}).passthrough();

const dollarPrefixedSchema = z.object({
  $value: z.any(),
  $type: z.string(),
  $description: z.string().optional(),
  $deprecated: z.union([z.boolean(), z.string(), deprecatedMetadataSchema]).optional(),
}).passthrough();

export const singleTokenSchema = z.union([baseSchema, dollarPrefixedSchema]);
