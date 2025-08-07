#!/usr/bin/env python3
"""
Script to clean up the DayDetailModal.tsx file by removing legacy reflection code
"""

def clean_daydetail_modal():
    file_path = "DayDetailModal.tsx"
    
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    # Find the line numbers we need
    reflection_hub_line = None
    secondary_sections_line = None
    
    for i, line in enumerate(lines):
        if "<ReflectionHub" in line:
            reflection_hub_line = i
        elif "Secondary Sections - Adaptive Layout" in line:
            secondary_sections_line = i
            break
    
    if reflection_hub_line is not None and secondary_sections_line is not None:
        # Keep everything up to the ReflectionHub closing />
        keep_until = reflection_hub_line
        for i in range(reflection_hub_line, len(lines)):
            if "/>" in lines[i]:
                keep_until = i + 1
                break
        
        # Remove everything from there until Secondary Sections
        new_lines = lines[:keep_until] + ["\n"] + lines[secondary_sections_line:]
        
        # Write back
        with open(file_path, 'w') as f:
            f.writelines(new_lines)
        
        print(f"Cleaned file - removed {secondary_sections_line - keep_until - 1} lines of legacy code")
    else:
        print("Could not find markers in file")

if __name__ == "__main__":
    clean_daydetail_modal()