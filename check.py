import os
import re

dirs = ["src/components", "src/components/admin", "src/components/WishCard/components"]
for d in dirs:
    if not os.path.exists(d): continue
    for root, _, files in os.walk(d):
        for f in files:
            if f.endswith('.tsx') or f.endswith('.ts'):
                path = os.path.join(root, f)
                with open(path, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                tags = re.findall(r'<(?:input|textarea)[^>]*>', content)
                for t in tags:
                    print(f"--- {path} ---")
                    # print only className
                    cls = re.search(r'className=["\']([^"\']*)["\']', t)
                    if cls:
                        print(f"class: {cls.group(1)}")
                    else:
                        print("No Class:", t)
