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
        tools: z.array(z.string()),
        playableLink: z.string().optional(),
        coverImage: z.string().optional(),
    }),
});

export const collections = { projects };