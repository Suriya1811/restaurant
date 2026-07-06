/**
 * Bundle the backend into a single executable JS file using esbuild.
 * This removes the need to copy node_modules into the final installer,
 * making the app smaller and more reliable.
 */

const { build } = require('esbuild');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const BACKEND_SRC = path.join(ROOT, 'backend', 'src', 'app.js');
const OUT_FILE = path.join(ROOT, 'backend', 'dist', 'index.js');

async function bundle() {
  console.log('📦 Bundling backend with esbuild...');

  try {
    // Ensure dist directory exists
    const distDir = path.dirname(OUT_FILE);
    if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

    await build({
      entryPoints: [BACKEND_SRC],
      outfile: OUT_FILE,
      bundle: true,
      platform: 'node',
      target: 'node20', // Matches modern Electron
      external: [
        'fsevents', 
        'mongodb-client-encryption', 
        'aws-sdk', 
        'mock-aws-s3', 
        'nock',
        'kerberos',
        '@mongodb-js/zstd',
        'snappy',
        '@aws-sdk/credential-providers',
        'gcp-metadata',
        'socks'
      ], // Avoid bundling native or optional driver modules
      minify: false, // Keep it readable for debugging if needed
      sourcemap: true,
      define: {
        'process.env.NODE_ENV': '"production"'
      }
    });

    console.log('✔  Backend bundled successfully to:', OUT_FILE);
  } catch (err) {
    console.error('✗  Bundling failed:', err.message);
    process.exit(1);
  }
}

bundle();
