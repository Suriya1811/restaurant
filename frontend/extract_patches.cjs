const fs = require('fs');
const readline = require('readline');

async function processTranscript() {
    const fileStream = fs.createReadStream('C:\\Users\\suriy\\.gemini\\antigravity-ide\\brain\\cc59b1c8-2d7a-4745-9765-d54a9b2b1f22\\.system_generated\\logs\\transcript_full.jsonl');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let patches = [];
    
    for await (const line of rl) {
        try {
            const step = JSON.parse(line);
            if (step.tool_calls) {
                for (const call of step.tool_calls) {
                    if (call.name === 'multi_replace_file_content' || call.name === 'replace_file_content') {
                        let args = typeof call.args === 'string' ? JSON.parse(call.args) : call.args;
                        if (args.TargetFile && args.TargetFile.includes('ProductMaster.jsx')) {
                            patches.push({ step: step.step_index, chunks: args.ReplacementChunks || [args] });
                        }
                    }
                }
            }
        } catch (e) {}
    }
    
    fs.writeFileSync('C:\\Works\\Mahix\\restaurant\\frontend\\extracted_patches.json', JSON.stringify(patches, null, 2));
    console.log('Extracted ' + patches.length + ' patches.');
}

processTranscript();
