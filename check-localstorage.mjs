#!/usr/bin/env node

console.log('=== Check localStorage Data ===\n');
console.log('Open browser console and run:\n');
console.log('const requests = JSON.parse(localStorage.getItem("requests") || "[]");');
console.log('console.log(`Found ${requests.length} campaigns in localStorage:`);');
console.log('requests.forEach((r, i) => console.log(`${i+1}. ${r.title} (ID: ${r.id}, Status: ${r.status})`));');
console.log('\n');
console.log('const creators = JSON.parse(localStorage.getItem("creators") || "[]");');
console.log('console.log(`\\nFound ${creators.length} creators in localStorage`);');
