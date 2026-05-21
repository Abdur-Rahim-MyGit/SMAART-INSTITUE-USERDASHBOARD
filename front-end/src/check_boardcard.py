
import re

file_path = r"c:\Users\dhars\Desktop\SMAART-INSTITUTE\SMAART-INSTITUE-USERDASHBOARD\front-end\src\features\visionBoard\pages\VisionBoardGalleryPro.jsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

def check_range(start_line, end_line):
    stack = []
    for i in range(start_line - 1, end_line):
        line = lines[i]
        # Ignore self-closing tags
        clean_line = re.sub(r'<[a-zA-Z0-9\.]+\s+[^>]*/>', '', line)
        matches = re.findall(r'<(div|section|main|motion\.div|AnimatePresence)|</(div|section|main|motion\.div|AnimatePresence)>', clean_line)
        for opening, closing in matches:
            if opening:
                stack.append((opening, i + 1))
            elif closing:
                if not stack:
                    print(f"Error: Unexpected closing tag </{closing}> on line {i+1}")
                else:
                    top, line_idx = stack.pop()
                    if top != closing:
                        print(f"Error: Mismatched tag. Expected </{top}> (from line {line_idx}), got </{closing}> on line {i+1}")
    return stack

print("Checking BoardCard (lines 55-234):")
remaining = check_range(55, 234)
print(f"Remaining stack: {remaining}")
