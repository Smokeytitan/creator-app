import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function checkPosts() {
  const { data: creators } = await supabase.from('creators').select('*');
  
  for (const creator of creators) {
    if (creator.posts && creator.posts.length > 0) {
      console.log(`\n${creator.name} (${creator.handle}):`);
      console.log(`  Total posts: ${creator.posts.length}`);
      console.log(`  Sample post:`, JSON.stringify(creator.posts[0], null, 2));
      break;
    }
  }
}

checkPosts();
