import { createServer as createNodeServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createServer({ dataFilePath = resolve(__dirname, 'data/data.json') } = {}) {
    return createNodeServer(async (request, response) => {
        if (request.method === 'GET' && request.url === '/api/data') {
            try {
                const contents = await readFile(dataFilePath, 'utf8');
                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(contents);
            } catch (error) {
                response.writeHead(500, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ error: 'Could not read data file' }));
            }
            return;
        }

        if (request.method === 'PUT' && request.url === '/api/data') {
            let body = '';
            request.setEncoding('utf8');
            request.on('data', (chunk) => {
                body += chunk;
            });
            request.on('end', async () => {
                try {
                    const parsed = JSON.parse(body);
                    await writeFile(dataFilePath, JSON.stringify(parsed, null, 2));
                    response.writeHead(200, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify(parsed));
                } catch (error) {
                    response.writeHead(400, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({ error: 'Could not save data' }));
                }
            });
            return;
        }

        response.writeHead(404, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Not found' }));
    });
}
