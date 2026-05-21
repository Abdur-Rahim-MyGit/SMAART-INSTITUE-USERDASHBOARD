
import os

file_path = r"c:\Users\dhars\Desktop\SMAART-INSTITUTE\SMAART-INSTITUE-USERDASHBOARD\front-end\src\features\visionBoard\pages\VisionBoardGalleryPro.jsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Clean up lines 890 to 910
# We want to make sure there's no stray text between tags
for i in range(890, 910):
    if i < len(lines):
        line = lines[i].strip()
        if line == ")} */}" or line == ")} */ }":
            lines[i] = "          )} */}\n"
        elif line == "</section>":
            lines[i] = "        </section>\n"
        elif line == "":
            lines[i] = "\n"

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Cleanup complete")
