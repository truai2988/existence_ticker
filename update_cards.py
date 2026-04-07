import os
import re

src_dir = r"c:\Users\ABC\existence_ticker\src"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    
    # 1. WishCard base styling and common glassmorphism cards
    content = content.replace('bg-white/40 backdrop-blur-3xl border border-white/60', 'bg-white shadow border border-slate-200')
    content = content.replace('bg-white/50 backdrop-blur-3xl border border-transparent', 'bg-white shadow-sm border border-slate-200')
    content = content.replace('bg-white/50 backdrop-blur-3xl', 'bg-white shadow-sm border border-slate-200')
    
    # Forms and specific inputs (often bg-white/60 with border-transparent)
    content = content.replace('bg-white/60 border border-transparent', 'bg-white shadow-sm border border-slate-200')
    
    # Remove border-transparent anywhere we already transitioned to paper (just to be safe, if we missed any)
    # Actually it's safer to just let the specific replacements handle it.
    
    # 2. General backdrop-blur cleanup for card surfaces
    content = re.sub(r'bg-white/\d+\s+backdrop-blur-?(?:sm|md|lg|xl|2xl|3xl)?', 'bg-white shadow-sm border border-slate-200', content)
    
    # Profile View specific
    content = content.replace('bg-white/50', 'bg-white')
    content = content.replace('bg-white/60', 'bg-white')

    # Border transparent cleanup where it used to be a card
    content = content.replace('border-transparent shadow-sm', 'border-slate-200 shadow-sm')
    
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
print(f"Scanned {count} files for layering updates.")
