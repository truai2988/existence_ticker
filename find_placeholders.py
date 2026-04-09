import os

dirs = ["src/components", "src/components/admin", "src/components/WishCard/components"]
for d in dirs:
    for root, _, files in os.walk(d):
        for f in files:
            if f.endswith('.tsx') or f.endswith('.ts'):
                path = os.path.join(root, f)
                with open(path, 'r', encoding='utf-8') as file:
                    lines = file.readlines()
                    for i, l in enumerate(lines):
                        if 'placeholder=' in l:
                            print(f"{path}:{i+1}")
                            # print next 2 lines
                            print(l.strip())
                            if i+1 < len(lines): print(lines[i+1].strip())
                            if i+2 < len(lines): print(lines[i+2].strip())
                            print("---")
