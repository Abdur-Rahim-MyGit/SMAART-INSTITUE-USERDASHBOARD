import os
import re

file_path = r"c:\Users\dhars\Desktop\SMAART-INSTITUTE\SMAART-INSTITUE-USERDASHBOARD\front-end\src\components\AnalyticsCharts.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the classes
pattern = re.compile(r"bg-white dark:bg-\[#002A5C\] p-6 rounded-(?:3xl|2xl|xl) shadow-sm border border-slate-100 dark:border-white/10")
replacement = "bg-white dark:bg-[#001630] p-6 rounded-2xl border border-[#d8e6f7] shadow-[0_2px_16px_rgba(26,56,132,0.07)] dark:border-[#1a3884]/20 dark:shadow-[0_2px_16px_rgba(0,0,0,0.25)]"

new_content = pattern.sub(replacement, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Replacement complete.")
