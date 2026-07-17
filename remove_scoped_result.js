const fs = require('fs');
const files = fs.readdirSync('frontend/src/pages/dashboard').filter(f => f.endsWith('.jsx'));

files.forEach(f => {
    let content = fs.readFileSync('frontend/src/pages/dashboard/' + f, 'utf8');
    const scopedPattern = /<span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1\.5 rounded-lg border border-slate-100 italic">[\s\S]*?Scoped Result:[\s\S]*?<\/span>/g;
    
    if (scopedPattern.test(content)) {
        content = content.replace(scopedPattern, '');
        fs.writeFileSync('frontend/src/pages/dashboard/' + f, content);
        console.log('Removed from ' + f);
    }
});
