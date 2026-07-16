import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDate, getFilteredItems } from '../js/generator.js';

test('regenerates one category without changing others', () => {
    const data = {
        restaurants: [{ name: 'R1', budget: '$', location: 'cincinnati' }],
        activities: [{ name: 'A1', budget: '$$', duration: '1-2hrs', location: 'cincinnati' }],
        desserts: [{ name: 'D1', budget: '$', location: '' }]
    };

    const first = generateDate(data, { budget: '$$', duration: '1-2hrs', location: 'cincinnati' }, {});
    const second = generateDate(data, { budget: '$$', duration: '1-2hrs', location: 'cincinnati' }, first);

    assert.equal(first.restaurant.name, 'R1');
    assert.equal(second.activity.name, 'A1');
    assert.equal(second.dessert.name, 'D1');
});

test('filters include lower-budget and shorter-duration options', () => {
    const items = [
        { name: 'A', budget: '$', duration: 'under-1hr' },
        { name: 'B', budget: '$$', duration: '1-2hrs' },
        { name: 'C', budget: '$$$', duration: '2plus-hrs' }
    ];

    const filtered = getFilteredItems(items, { budget: '$$', duration: '1-2hrs' });
    assert.deepEqual(filtered.map((item) => item.name), ['A', 'B']);
});
