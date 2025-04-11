// app/models/schemas.ts

import { z } from 'zod';

/**
 * Zod schema for validating generation options
 */
export const GenerationOptionsSchema = z.object({
  length: z.number()
    .int()
    .min(100, 'Content length must be at least 100 words')
    .max(500, 'Content length cannot exceed 500 words'),
  tone: z.enum(['professional', 'casual', 'enthusiastic']).optional(),
  includeKeywords: z.array(z.string()).optional(),
});

/**
 * Zod schema for validating the app settings form
 */
export const AppSettingsSchema = z.object({
  apiProvider: z.enum(['openaiApiKey', 'deepseekApiKey']),
  apiKey: z.string()
    .min(20, 'API key appears to be too short')
    .max(100, 'API key appears to be too long'),
  customPrompt: z.string()
    .min(10, 'Custom prompt must be at least 10 characters')
    .max(1000, 'Custom prompt cannot exceed 1000 characters'),
  defaultLength: z.number()
    .int()
    .min(100, 'Default length must be at least 100 words')
    .max(500, 'Default length cannot exceed 500 words'),
});

/**
 * Zod schema for validating product content
 */
export const ProductContentSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z.string()
    .min(50, 'Description must be at least 50 characters'),
  seoTitle: z.string().max(70, 'SEO title should be 70 characters or less').optional(),
  seoDescription: z.string().max(160, 'SEO description should be 160 characters or less').optional(),
  keywords: z.array(z.string()).optional(),
});

/**
 * Zod schema for validating the feedback form
 */
export const FeedbackSchema = z.object({
  feedback: z.string()
    .min(10, 'Feedback must be at least 10 characters')
    .max(500, 'Feedback cannot exceed 500 characters'),
  length: z.number()
    .int()
    .min(100, 'Content length must be at least 100 words')
    .max(500, 'Content length cannot exceed 500 words'),
});