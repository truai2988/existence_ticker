const fs = require('fs');
const path = require('path');

function replaceInFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInFiles(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let originalContent = fs.readFileSync(fullPath, 'utf8');
            let content = originalContent;
            
            // Remove redundant pairs like "text-[9px] md:text-xs" -> "text-xs"
            content = content.replace(/text-\[(?:8|9|10|11)px\]\s+(?:sm|md|lg):text-xs/g, 'text-xs');
            // General replacement for any remaining text-[<12px]
            content = content.replace(/text-\[(?:8|9|10|11)px\]/g, 'text-xs');
            
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

replaceInFiles('c:/Users/truee/existence_ticker/src');
console.log('Done.');
