import os

def replace_in_file(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Simple text replacements tailored to each file based on what we saw
    if "AuthScreen.tsx" in filepath:
        content = content.replace("placeholder:text-slate-700 text-base\"", "placeholder:text-slate-700 text-sm\"")
        content = content.replace("transition-all appearance-none text-base\"", "transition-all appearance-none text-sm\"")
        content = content.replace("disabled:opacity-50 text-base\"", "disabled:opacity-50 text-sm\"")
        content = content.replace("transition-all text-base appearance-none\"", "transition-all text-sm appearance-none\"")
        content = content.replace("font-mono text-base\"", "font-mono text-sm\"")
    
    if "ProfileEditScreen.tsx" in filepath:
        content = content.replace("text-base min-h-[100px]", "text-sm min-h-[100px]")
        content = content.replace("placeholder:text-slate-700 text-base\"", "placeholder:text-slate-700 text-sm\"")
        content = content.replace("font-mono text-base tracking-[0.2em]", "font-mono text-sm tracking-[0.2em]")

    if "AccountSettingsModal.tsx" in filepath:
        content = content.replace("disabled:bg-red-50/50 font-sans text-base\"", "disabled:bg-red-50/50 font-sans text-sm\"")
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

replace_in_file("src/components/AuthScreen.tsx")
replace_in_file("src/components/ProfileEditScreen.tsx")
replace_in_file("src/components/AccountSettingsModal.tsx")
print("Done")
