import fs from 'fs';
import path from 'path';

function normalizeMonthRef(monthStr) {
  if (!monthStr) return '';
  const clean = String(monthStr).trim().toLowerCase()
    .replace(/\s+/g, '')
    .replace('-', '/');
  // Handle variations like agosto/2026, agosto-2026, 2026-08
  if (clean.includes('setembro') || clean === '2026/09' || clean === '2026-09') return '2026-09';
  if (clean.includes('agosto') || clean === '2026/08' || clean === '2026-08') return '2026-08';
  if (clean.includes('julho') || clean === '2026/07' || clean === '2026-07') return '2026-07';
  if (clean.includes('junho') || clean === '2026/06' || clean === '2026-06') return '2026-06';
  if (clean.includes('maio') || clean === '2026/05' || clean === '2026-05') return '2026-05';
  return clean;
}

function mergeRecords(target, source) {
  const merged = { ...target };
  for (const [key, val] of Object.entries(source)) {
    if (val === undefined || val === null || val === '') continue;
    
    // If target value is empty/null/false and source has a value, adopt source value
    if (merged[key] === undefined || merged[key] === null || merged[key] === '' || merged[key] === false || merged[key] === '0' || merged[key] === 0) {
      merged[key] = val;
    } else if (key === 'status' && val === 'paid') {
      merged[key] = 'paid';
    } else if (key === 'receipt_code' && val) {
      merged[key] = val;
    } else if (key === 'paid_amount' && Number(val) > Number(merged[key] || 0)) {
      merged[key] = val;
    } else if (key === 'updated_date' && String(val) > String(merged[key] || '')) {
      merged[key] = val;
    }
  }
  return merged;
}

async function deduplicateAll() {
  const seedPath = path.resolve('src/data/seedDeliveries.json');
  if (!fs.existsSync(seedPath)) {
    console.error('File not found:', seedPath);
    return;
  }

  const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const stats = {};

  for (const [entityName, records] of Object.entries(seedData)) {
    if (!Array.isArray(records) || records.length === 0) continue;

    const initialCount = records.length;
    let deduplicated = [];

    if (entityName === 'Tuition') {
      const map = new Map();
      for (const item of records) {
        const email = String(item.student_email || '').trim().toLowerCase();
        const month = normalizeMonthRef(item.month_ref);
        const groupKey = email && month ? `${email}:${month}` : item.id;

        if (map.has(groupKey)) {
          const existing = map.get(groupKey);
          map.set(groupKey, mergeRecords(existing, item));
        } else {
          map.set(groupKey, { ...item });
        }
      }
      deduplicated = Array.from(map.values());
    } else if (entityName === 'WallReadReceipt') {
      const map = new Map();
      for (const item of records) {
        const key = item.dedupe_key || (item.reader_email && item.highlight_key ? `${item.reader_email.toLowerCase()}:${item.highlight_key}` : item.id);
        if (map.has(key)) {
          map.set(key, mergeRecords(map.get(key), item));
        } else {
          map.set(key, { ...item });
        }
      }
      deduplicated = Array.from(map.values());
    } else if (entityName === 'Achievement') {
      const map = new Map();
      for (const item of records) {
        const key = item.dedupe_key || item.id;
        if (map.has(key)) {
          map.set(key, mergeRecords(map.get(key), item));
        } else {
          map.set(key, { ...item });
        }
      }
      deduplicated = Array.from(map.values());
    } else {
      // Default deduplication by ID
      const map = new Map();
      for (const item of records) {
        const key = item.id || JSON.stringify(item);
        if (map.has(key)) {
          map.set(key, mergeRecords(map.get(key), item));
        } else {
          map.set(key, { ...item });
        }
      }
      deduplicated = Array.from(map.values());
    }

    seedData[entityName] = deduplicated;
    stats[entityName] = { initialCount, finalCount: deduplicated.length, removed: initialCount - deduplicated.length };
  }

  fs.writeFileSync(seedPath, JSON.stringify(seedData, null, 2), 'utf8');
  console.log('--- Global Entity Deduplication Summary ---');
  for (const [entity, s] of Object.entries(stats)) {
    if (s.removed > 0) {
      console.log(`[${entity}] Initial: ${s.initialCount} -> Final: ${s.finalCount} (Merged ${s.removed} duplicate(s))`);
    } else {
      console.log(`[${entity}] Count: ${s.finalCount} (No duplicates)`);
    }
  }
}

deduplicateAll().catch(err => {
  console.error('Deduplication failed:', err);
  process.exit(1);
});
