import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
	schema: z.object({
		title: z.string(),
		category: z.array(z.string()),
		status: z.enum(['Finished', 'In Progress']),
		type: z.enum(['Coursework', 'Personal']),
		featured: z.boolean(),
		date: z.date(),
		tools: z.array(z.string()).default([]),
		engine: z.string().optional(),
		duration: z.string().optional(),
		assetsUsed: z.array(z.string()).optional(),
		iterations: z.number().optional(),
		playtests: z.number().optional(),
		hook: z.string().optional(),
		heroVideo: z.string().optional(),
		genre: z.string().optional(),
		role: z.string().optional(),
		studio: z.string().optional(),
		teamSize: z.string().optional(),
		playableLink: z.string().optional(),
		coverImage: z.string().optional(),
		coverImagePosition: z.string().optional(),
	}),
});

export const collections = { projects };