
import os
import re

file_path = r"c:\Users\dhars\Desktop\SMAART-INSTITUTE\SMAART-INSTITUE-USERDASHBOARD\front-end\src\features\visionBoard\pages\VisionBoardGalleryPro.jsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

stack = []
for i, line in enumerate(lines):
    # Find all opening tags (not self-closing) and closing tags
    # regex matches <tag but not <tag ... />
    # Also matches </tag>
    
    # Use a simpler approach: remove self-closing tags first
    clean_line = re.sub(r'<[a-zA-Z0-9\.]+\s+[^>]*/>', '', line)
    
    matches = re.findall(r'<(div|section|main|motion\.div|AnimatePresence)|</(div|section|main|motion\.div|AnimatePresence)>', clean_line)
    for opening, closing in matches:
        if opening:
            stack.append((opening, i))
        elif closing:
            if not stack:
                print(f"Error: Unexpected closing tag </{closing}> on line {i+1}")
            else:
                top, line_idx = stack.pop()
                if top != closing:
                    print(f"Error: Mismatched tag. Expected </{top}> (from line {line_idx+1}), got </{closing}> on line {i+1}")

print(f"Remaining stack: {stack}")
