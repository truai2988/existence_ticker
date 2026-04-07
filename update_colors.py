import os
import re

src_dir = r"c:\Users\ABC\existence_ticker\src"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    
    # 1. Colors replacement
    content = content.replace('text-slate-800', 'text-slate-900')
    content = content.replace('text-slate-700', 'text-slate-900')
    content = content.replace('text-slate-600', 'text-slate-800')
    content = content.replace('text-slate-500', 'text-slate-700')
    
    # Border darken
    content = content.replace('border-slate-100', 'border-slate-200')
    content = content.replace('border-slate-200', 'border-slate-300')

    # Opacity reduction in classes, strictly avoiding "disabled:"
    # Use regex negative lookbehind to ensure we don't match disabled:opacity-50
    content = re.sub(r'(?<!disabled:)opacity-50\b', 'opacity-80', content)
    content = re.sub(r'(?<!disabled:)opacity-60\b', 'opacity-90', content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")

count = 0
for root, _, files in os.walk(src_dir):
    for filename in files:
        if filename.endswith(('.tsx', '.ts')):
            filepath = os.path.join(root, filename)
            process_file(filepath)
            count += 1
print(f"Scanned {count} files.")
