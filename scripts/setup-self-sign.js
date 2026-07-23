const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const CERT_DIR = path.join(ROOT, 'resources');
const CERT_PATH = path.join(CERT_DIR, 'dev-cert.pfx');
const PASSWORD = 'password123';

async function setup() {
  console.log('Generating local developer certificate...');

  try {
    if (!fs.existsSync(CERT_DIR)) {
      fs.mkdirSync(CERT_DIR, { recursive: true });
    }

    if (fs.existsSync(CERT_PATH)) {
      console.log('Certificate already exists at:', CERT_PATH);
    } else {
      // 1. Generate self-signed certificate and export to PFX using PowerShell
      const psScript = `
        $ErrorActionPreference = 'Stop';
        $cert = New-SelfSignedCertificate -Type Custom -Subject 'CN=Yugam Software Dev' -KeyUsage DigitalSignature -FriendlyName 'Yugam Software Dev Publisher' -CertStoreLocation 'Cert:\\CurrentUser\\My' -NotAfter (Get-Date).AddYears(5);
        $pwd = ConvertTo-SecureString -String '${PASSWORD}' -Force -AsPlainText;
        Export-PfxCertificate -Cert $cert -FilePath '${CERT_PATH.replace(/\\/g, '/')}' -Password $pwd;
        Write-Host "CERT_GENERATED";
      `.trim().replace(/\n/g, ' ');

      const out = execSync(`powershell -NoProfile -Command "${psScript}"`, { encoding: 'utf8' });
      if (!out.includes('CERT_GENERATED')) {
        throw new Error('PowerShell certificate generation failed.');
      }
      console.log('✔ Local developer certificate generated successfully.');
    }

    // 2. Import the certificate to the local Trusted Root and Trusted Publisher stores
    console.log('Installing certificate to Trusted Root and Trusted Publisher stores to prevent OS blocks...');
    const importPsScript = `
      $ErrorActionPreference = 'Stop';
      $pwd = ConvertTo-SecureString -String '${PASSWORD}' -Force -AsPlainText;
      Import-PfxCertificate -FilePath '${CERT_PATH.replace(/\\/g, '/')}' -CertStoreLocation 'Cert:\\CurrentUser\\Root' -Password $pwd;
      Import-PfxCertificate -FilePath '${CERT_PATH.replace(/\\/g, '/')}' -CertStoreLocation 'Cert:\\CurrentUser\\TrustedPublisher' -Password $pwd;
      Write-Host "CERT_INSTALLED";
    `.trim().replace(/\n/g, ' ');

    const importOut = execSync(`powershell -NoProfile -Command "${importPsScript}"`, { encoding: 'utf8' });
    if (!importOut.includes('CERT_INSTALLED')) {
      throw new Error('Certificate installation failed.');
    }
    console.log('✔ Certificate installed locally for Current User.');
    console.log('\n--- Setup Complete! ---');
    console.log('The built app will be automatically signed and trusted on this machine.');
  } catch (err) {
    console.error('✗ Failed to set up signing:', err.message);
    process.exit(1);
  }
}

setup();
