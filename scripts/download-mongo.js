/**
 * Downloads the MongoDB 7.x Windows x64 binary (mongod.exe) into resources/mongod/
 * Run once before building: npm run download-mongo
 */

const https  = require('https');
const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const { execSync } = require('child_process');

// MongoDB 7.0 Community Server (Windows x64, zip)
const MONGO_URL =
  'https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.14.zip';

const OUT_DIR  = path.join(__dirname, '..', 'resources', 'mongod');
const ZIP_PATH = path.join(__dirname, '..', 'resources', 'mongodb-win.zip');
const MONGOD   = path.join(OUT_DIR, 'mongod.exe');

if (fs.existsSync(MONGOD)) {
  console.log('✔  mongod.exe already exists at:', MONGOD);
  process.exit(0);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

console.log('⬇  Downloading MongoDB 7.0 (~120 MB)…');
console.log('   URL:', MONGO_URL);

function download(url, dest, redirectCount = 0) {
  if (redirectCount > 5) throw new Error('Too many redirects');
  const protocol = url.startsWith('https') ? https : http;

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    protocol.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return download(res.headers.location, dest, redirectCount + 1)
          .then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const total = parseInt(res.headers['content-length'] || '0', 10);
      let received = 0;
      res.on('data', chunk => {
        received += chunk.length;
        if (total) {
          const pct = ((received / total) * 100).toFixed(1);
          process.stdout.write(`\r   ${pct}% (${(received/1e6).toFixed(1)} MB)`);
        }
      });
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

(async () => {
  try {
    await download(MONGO_URL, ZIP_PATH);
    console.log('\n✔  Download complete. Extracting mongod.exe…');

    // Use PowerShell to extract
    const ps = `
      Add-Type -AssemblyName System.IO.Compression.FileSystem;
      $zip = [System.IO.Compression.ZipFile]::OpenRead('${ZIP_PATH.replace(/\\/g,'/')}');
      $entry = $zip.Entries | Where-Object { $_.Name -eq 'mongod.exe' } | Select-Object -First 1;
      if ($entry) {
        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, '${MONGOD.replace(/\\/g,'/')}', $true);
        Write-Host 'Extracted';
      } else { Write-Host 'NOT FOUND'; }
      $zip.Dispose();
    `.trim().replace(/\n/g, ' ');

    const out = execSync(`powershell -NoProfile -Command "${ps}"`, { encoding: 'utf8' });
    if (!out.includes('Extracted')) throw new Error('mongod.exe not found in zip');

    fs.unlinkSync(ZIP_PATH);
    console.log('✔  mongod.exe saved to:', MONGOD);
    console.log('\nYou can now run: npm run build');
  } catch (err) {
    console.error('\n✗  Failed:', err.message);
    console.error('\nManual steps:');
    console.error('  1. Download MongoDB 7.x zip from https://www.mongodb.com/try/download/community');
    console.error('  2. Extract mongod.exe to: resources/mongod/mongod.exe');
    process.exit(1);
  }
})();
