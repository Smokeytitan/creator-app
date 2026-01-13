#!/usr/bin/env node

import axios from 'axios';

const SHEET_ID = '1J75nBdYNyQivMdi7XihhpYr6aXOnCNcJIAjTQLwjkXk';

// Known sheet IDs (gid parameters)
const SHEETS = {
  'Creators (gid=1537582832)': 1537582832,
  // Add more if you know other sheet names/gids
};

console.log('=== Fetching Google Sheets Data ===\n');

for (const [name, gid] of Object.entries(SHEETS)) {
  console.log(`\nFetching: ${name}`);
  console.log('=' .repeat(50));
  
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  
  try {
    const response = await axios.get(url);
    const lines = response.data.split('\n').slice(0, 10); // First 10 lines
    
    console.log('First 10 rows:');
    lines.forEach((line, i) => {
      console.log(`${i + 1}: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

console.log('\n\nTo add campaigns support:');
console.log('1. Find the sheet tab with campaigns data');
console.log('2. Look at the URL when viewing that tab: gid=XXXXXXX');
console.log('3. Tell me the gid and the format of the data');

