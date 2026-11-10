import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, '../public/assets/aistudio');
const OUTPUT_FILE = path.join(ASSETS_DIR, 'ScoreItem_merged.csv');

/**
 * Basic RFC 4180 compliant CSV parser that handles quotes and line breaks inside quoted fields.
 */
function parseCsvRecords(content) {
  const records = [];
  let currentRecord = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRecord.push(currentField);
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRecord.push(currentField);
        records.push(currentRecord);
        currentRecord = [];
        currentField = '';
      } else if (char === '\n') {
        currentRecord.push(currentField);
        records.push(currentRecord);
        currentRecord = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRecord.length > 0) {
    currentRecord.push(currentField);
    records.push(currentRecord);
  }

  return records;
}

function stringifyCsvRecord(fields) {
  return fields
    .map(val => {
      const stringified = String(val ?? '');
      if (stringified.includes('"') || stringified.includes(',') || stringified.includes('\n') || stringified.includes('\r')) {
        return `"${stringified.replace(/"/g, '""')}"`;
      }
      return `"${stringified}"`;
    })
    .join(',');
}

export function mergeScoreItemCsvs() {
  if (!fs.existsSync(ASSETS_DIR)) {
    console.error('Assets directory not found:', ASSETS_DIR);
    return;
  }

  const files = fs
    .readdirSync(ASSETS_DIR)
    .filter(f => /^ScoreItem_parte_\d+.*\.csv$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  if (files.length === 0) {
    console.log('No ScoreItem_parte_*.csv files found to merge.');
    return;
  }

  console.log(`Found ${files.length} CSV part(s) to merge:`, files);

  let headerRecord = null;
  const seenIds = new Set();
  const mergedRecords = [];
  let totalRawRecords = 0;

  for (const file of files) {
    const filePath = path.join(ASSETS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const records = parseCsvRecords(content).filter(r => r.length > 0 && (r.length > 1 || r[0].trim() !== ''));

    if (records.length === 0) continue;

    // Header check
    const firstRow = records[0];
    const isHeaderRow = firstRow.some(cell => cell.toLowerCase().includes('student_email') || cell.toLowerCase().includes('category'));

    const dataRows = isHeaderRow ? records.slice(1) : records;

    if (!headerRecord && isHeaderRow) {
      headerRecord = firstRow;
    }

    const idIndex = isHeaderRow ? firstRow.findIndex(c => c.toLowerCase() === 'id') : 10;

    for (const row of dataRows) {
      totalRawRecords++;
      const idVal = idIndex >= 0 && idIndex < row.length ? row[idIndex] : null;

      if (idVal && idVal.trim()) {
        if (seenIds.has(idVal.trim())) {
          continue; // Duplicate record
        }
        seenIds.add(idVal.trim());
      }

      mergedRecords.push(row);
    }
  }

  if (!headerRecord) {
    headerRecord = [
      'student_email', 'category', 'ref_id', 'ref_title', 'module_number',
      'score', 'max_score', 'verified', 'notes', 'reviewed_by',
      'id', 'created_date', 'updated_date', 'created_by_id', 'is_sample'
    ];
  }

  const csvLines = [
    stringifyCsvRecord(headerRecord),
    ...mergedRecords.map(r => stringifyCsvRecord(r))
  ];

  fs.writeFileSync(OUTPUT_FILE, csvLines.join('\n'), 'utf-8');

  console.log(`Successfully merged ${files.length} CSV file(s) into ${OUTPUT_FILE}`);
  console.log(`Total raw records processed: ${totalRawRecords}`);
  console.log(`Total unique records in merged file: ${mergedRecords.length}`);
  return {
    filesMerged: files,
    totalRawRecords,
    uniqueRecords: mergedRecords.length,
    outputPath: OUTPUT_FILE
  };
}

if (process.argv[1] && process.argv[1].endsWith('mergeScoreItems.js')) {
  mergeScoreItemCsvs();
}
