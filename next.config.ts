import type { NextConfig } from 'next';
import { execFileSync } from 'node:child_process';
import notes from './src/data/release-notes.json';
// Pages provides the immutable Git revision. Local builds use the same identity.
let releaseId=process.env.CF_PAGES_COMMIT_SHA;
if(!releaseId){try{releaseId=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{releaseId=notes.fallbackVersion;}}
const config: NextConfig = { output: 'export', trailingSlash: true, images: { unoptimized: true }, poweredByHeader: false,
  env:{NEXT_PUBLIC_RELEASE_ID:releaseId} };
export default config;
