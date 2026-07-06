const fs = require('fs');
const { Jimp } = require('jimp');
const pngToIco = require('png-to-ico').default;

async function convert() {
    try {
        console.log('Reading JPEG...');
        const image = await Jimp.read('src/Logo.jpeg');
        // Ensure image is square and correct size for ico if needed, or just let it convert
        await image.resize({ w: 256, h: 256 }).write('temp_logo.png');
        console.log('Saved as PNG. Converting to ICO...');
        const buf = await pngToIco('temp_logo.png');
        fs.writeFileSync('resources/icon.ico', buf);
        console.log('Successfully created resources/icon.ico');
    } catch (e) {
        console.error('Error converting image:', e);
    }
}

convert();
