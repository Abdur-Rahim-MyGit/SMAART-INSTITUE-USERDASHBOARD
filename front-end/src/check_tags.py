
import os
import re

file_path = r"c:\Users\dhars\Desktop\SMAART-INSTITUTE\SMAART-INSTITUE-USERDASHBOARD\front-end\src\features\visionBoard\pages\VisionBoardGalleryPro.jsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Simple tag balancer for <div> and </div>
tags = re.findall(r'<(div|/div|section|/section|main|/main|motion\.div|/motion\.div)', content)

level = 0
unbalanced = []
for tag in tags:
    if tag.startswith('/'):
        level -= 1
    else:
        level += 1
    if level < 0:
        unbalanced.append(tag)
        level = 0

print(f"Final Level: {level}")
if level != 0:
    print("Tags are unbalanced!")
