// TODO: Replace these values with your Supabase project settings.
// SUPABASE_URL should be your Supabase project URL, e.g. https://xyzcompany.supabase.co
// SUPABASE_ANON_KEY should be your Supabase anon public key.
const SUPABASE_URL = 'https://ocdofbtdmlkzxcomvwez.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JuXT1IvQTwi5b1SA7YiV1g_riFxSfi4';

function isSupabaseConfigured() {
    return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('YOUR-SUPABASE_URL') && !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY'));
}

function restHeaders() {
    return {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Accept': 'application/json'
    };
}

function buildDataStructure(rows) {
    return rows.reduce(
        (acc, row) => {
            const item = {
                name: row.name,
                location: row.location || '',
                budget: row.budget || '',
                duration: row.duration || '',
                setting: row.setting || ''
            };

            if (row.category === 'restaurants') {
                acc.restaurants.push(item);
            } else if (row.category === 'activities') {
                acc.activities.push(item);
            } else if (row.category === 'desserts') {
                acc.desserts.push(item);
            }

            return acc;
        },
        { restaurants: [], activities: [], desserts: [] }
    );
}

function flattenDataForSupabase(data) {
    return [
        ...(data.restaurants || []).map((item) => ({ ...item, category: 'restaurants', setting: item.setting || '' })),
        ...(data.activities || []).map((item) => ({ ...item, category: 'activities', setting: item.setting || '' })),
        ...(data.desserts || []).map((item) => ({ ...item, category: 'desserts', setting: item.setting || '' }))
    ];
}

async function readFromDatabase() {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured yet');
    }

    const url = `${SUPABASE_URL}/rest/v1/date_ideas?select=*`;
    const res = await fetch(url, { headers: restHeaders() });
    if (!res.ok) {
        throw new Error(await res.text());
    }

    const rows = await res.json();
    return buildDataStructure(rows || []);
}

async function writeToDatabase(data) {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured yet');
    }

    // Prepare rows for upsert via PostgREST
    const rows = flattenDataForSupabase(data);

    // Load existing rows to find matching IDs
    const listUrl = `${SUPABASE_URL}/rest/v1/date_ideas?select=*`;
    const listRes = await fetch(listUrl, { headers: restHeaders() });
    if (!listRes.ok) throw new Error(await listRes.text());
    const existingRows = await listRes.json();

    // Perform per-row PATCH (update) when a matching row exists, otherwise collect for insert.
    const existingMap = new Map();
    (existingRows || []).forEach((r) => {
        const key = `${r.category}||${r.name}`;
        existingMap.set(key, r.id);
    });

    const updatedIds = [];
    const toInsert = [];

    for (const row of rows) {
        const key = `${row.category}||${row.name}`;
        if (existingMap.has(key)) {
            // PATCH the existing row
            const id = existingMap.get(key);
            const patchUrl = `${SUPABASE_URL}/rest/v1/date_ideas?id=eq.${encodeURIComponent(id)}`;
            const patchRes = await fetch(patchUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...restHeaders(),
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(row)
            });

            if (!patchRes.ok) {
                throw new Error(await patchRes.text());
            }

            const patched = await patchRes.json();
            if (patched && patched[0] && patched[0].id) updatedIds.push(patched[0].id);
        } else {
            toInsert.push(row);
        }
    }

    // Insert new rows in a single request
    const insertedIds = [];
    if (toInsert.length > 0) {
        const insUrl = `${SUPABASE_URL}/rest/v1/date_ideas`;
        const insRes = await fetch(insUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...restHeaders(),
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(toInsert)
        });

        if (!insRes.ok) {
            throw new Error(await insRes.text());
        }

        const inserted = await insRes.json();
        (inserted || []).forEach((r) => insertedIds.push(r.id));
    }

    const keptIds = new Set([...updatedIds, ...insertedIds].filter(Boolean));

    // Delete DB rows that are not present in keptIds
    const idsToDelete = (existingRows || []).map((r) => r.id).filter((id) => !keptIds.has(id));
    if (idsToDelete.length > 0) {
        const encoded = encodeURIComponent(`(${idsToDelete.join(',')})`);
        const delUrl = `${SUPABASE_URL}/rest/v1/date_ideas?id=in.${encoded}`;
        const delRes = await fetch(delUrl, {
            method: 'DELETE',
            headers: restHeaders()
        });
        if (!delRes.ok) {
            throw new Error(await delRes.text());
        }
    }
}

export async function loadData() {
    try {
        // Always read directly from Supabase
        return await readFromDatabase();
    } catch (error) {
        console.error('Supabase load failed:', error.message || error);
        return { restaurants: [], activities: [], desserts: [] };
    }
}

export async function saveData(data) {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in js/storage.js');
    }

    try {
        await writeToDatabase(data);
    } catch (error) {
        console.error('Failed to persist data to Supabase:', error.message || error);
        throw error;
    }
}
