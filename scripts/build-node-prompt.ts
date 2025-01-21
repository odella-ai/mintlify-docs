import fs from 'fs';
import path from 'path';

// Function to recursively get all MDX files
function getMdxFiles(dir: string): string[] {
    const files: string[] = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && item !== 'not-used') {
            files.push(...getMdxFiles(fullPath));
        } else if (path.extname(fullPath) === '.mdx' && !fullPath.endsWith('all-blocks.mdx')) {
            files.push(fullPath);
        }
    }

    return files;
}

// Function to clean MDX content
function cleanMdxContent(content: string): string {
    // Remove React component tags and their content
    content = content.replace(/<Frame>[\s\S]*?<\/Frame>/g, '');
    content = content.replace(/<img[^>]*>/g, '');
    
    // Remove other common React/MDX components if needed
    content = content.replace(/\n\n\n/g, '');
    
    return content.trim();
}

// Main function to build the prompt
async function buildNodeDetailsPrompt() {
    const blockRefPath = "./block-reference"
    const mdxFiles = getMdxFiles(blockRefPath);
    let finalPrompt = '# Block Reference Documentation\n\n';

    for (const file of mdxFiles) {
        // Get relative path for section heading
        const relativePath = path.relative(blockRefPath, file);
        const content = fs.readFileSync(file, 'utf-8');
        const cleanedContent = cleanMdxContent(content);

        if (cleanedContent) {
            finalPrompt += `\n## ${relativePath}\n\n${cleanedContent}\n\n---\n\n`;
        }
    }

    // Write the final prompt to a file
    const outputPath = 'node-docs-prompt.txt'
    fs.writeFileSync(outputPath, finalPrompt);
    console.log(`Prompt has been written to ${outputPath}`);
}


// Main function to build the prompt
async function buildNodeInfoPrompt() {
    const blockRefPath = "./block-reference"
    const mdxFiles = getMdxFiles(blockRefPath);
    let finalPrompt = '# Block Reference Quick Info\n\n';

    for (const file of mdxFiles) {
        const relativePath = path.relative(blockRefPath, file);
        const content = fs.readFileSync(file, 'utf-8');

        // Extract frontmatter info using regex
        const idMatch = content.match(/id:\s*([^\n]+)/);
        const titleMatch = content.match(/title:\s*([^\n]+)/); 
        const descriptionMatch = content.match(/description:\s*([^\n]+)/);

        if (idMatch && titleMatch && descriptionMatch) {
            const id = idMatch[1].trim();
            const title = titleMatch[1].trim();
            const description = descriptionMatch[1].trim();

            finalPrompt += `Path: ${relativePath}\n`;
            finalPrompt += `ID: ${id}\n`;
            finalPrompt += `Name: ${title}\n`; 
            finalPrompt += `Description: ${description}\n\n`;
            finalPrompt += `---\n\n`;
        }
    }

    // Write the final prompt to a file
    const outputPath = 'node-docs-info-prompt.txt'
    fs.writeFileSync(outputPath, finalPrompt);
    console.log(`Quick reference prompt has been written to ${outputPath}`);
}

buildNodeInfoPrompt().catch(console.error);
