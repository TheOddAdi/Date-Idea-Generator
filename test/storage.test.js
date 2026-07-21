import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from '../server.js';

async function withTempServer(t, callback) {
    const tempDir = await mkdtemp(join(tmpdir(), 'date-generator-'));
    const dataFilePath = join(tempDir, 'data.json');
    await writeFile(dataFilePath, JSON.stringify({ restaurants: [] }, null, 2));

    const server = createServer({ dataFilePath });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();

    try {
        await callback({ port, dataFilePath });
    } finally {
        await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
        await rm(tempDir, { recursive: true, force: true });
    }
}

test('PUT /api/data writes changes to the data file', async () => {
    await withTempServer({}, async ({ port, dataFilePath }) => {
        const response = await fetch(`http://127.0.0.1:${port}/api/data`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                restaurants: [{ name: 'Test Spot', budget: '$$', location: 'Cincinnati' }],
                activities: [],
                desserts: []
            })
        });

        assert.equal(response.status, 200);

        const saved = JSON.parse(await readFile(dataFilePath, 'utf8'));
        assert.equal(saved.restaurants[0].name, 'Test Spot');
    });
});
