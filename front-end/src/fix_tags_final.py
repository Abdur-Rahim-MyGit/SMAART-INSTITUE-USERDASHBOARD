
import os

file_path = r"c:\Users\dhars\Desktop\SMAART-INSTITUTE\SMAART-INSTITUE-USERDASHBOARD\front-end\src\features\visionBoard\pages\VisionBoardGalleryPro.jsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the line with Start Creating
start_creating_idx = -1
for i, line in enumerate(lines):
    if "Start Creating" in line and "<ArrowRight" in line:
        start_creating_idx = i
        break

if start_creating_idx != -1:
    # Look for the closing tags after this
    # We expect: </div> (buttons), </div> (modal content), </motion.div> (inner), </motion.div> (outer)
    # Right now it probably has: </div>, </motion.div>, </motion.div>
    
    # We will replace everything from the first </div> after start_creating_idx to the next )}
    end_idx = -1
    for i in range(start_creating_idx, len(lines)):
        if ")}" in lines[i]:
            end_idx = i
            break
    
    if end_idx != -1:
        new_lines = [
            "              </div>\n",
            "            </div>\n",
            "          </motion.div>\n",
            "        </motion.div>\n",
            "      )}\n"
        ]
        lines[start_creating_idx + 2 : end_idx + 1] = new_lines

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Tag fix complete")
