import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

async function getDocsHtml(path: string): Promise<string> {
    try {
        // Make request to docs site
        const response = await fetch(`https://docs.lawme.ai/block-reference/${path}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch docs: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        
        // Load HTML into cheerio
        const $ = cheerio.load(html);
        
        // Get content from content-area div
        const content = $('#content-area').html();
        
        if (!content) {
            throw new Error('Could not find content area in docs page');
        }

        // Convert HTML to Markdown
        const turndownService = new TurndownService();
        const markdown = turndownService.turndown(content);
        return markdown;
        
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to fetch docs: ${error.message}`);
        }
        throw error;
    }
}

console.log(await getDocsHtml("ai/ask-ai"))
