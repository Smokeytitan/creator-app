import axios from 'axios';

const DELIVERABLES_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1J75nBdYNyQivMdi7XihhpYr6aXOnCNcJIAjTQLwjkXk/export?format=csv&gid=0';

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  return lines.map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    return values;
  });
}

const response = await axios.get(DELIVERABLES_SHEET_URL);
const data = parseCSV(response.data);

console.log('Header row:');
console.log(data[0]);
console.log('\nFirst data row:');
console.log(data[1]);
console.log('\nColumn count:', data[0].length);
