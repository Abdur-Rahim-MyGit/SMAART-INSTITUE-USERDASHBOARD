"""
Patch CareerAgentOnboarding.jsx:
1. Insert validation banner before the NAVIGATION comment
2. Change btn-primary-onboard to include shake class when errors exist
"""
import os

filepath = os.path.join(os.path.dirname(__file__), 'CareerAgentOnboarding.jsx')

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the NAVIGATION comment line
nav_line_idx = None
btn_line_idx = None

for i, line in enumerate(lines):
    if 'NAVIGATION' in line and '{/*' in line:
        nav_line_idx = i
    if 'className="btn-primary-onboard"' in line and 'handleNext' in line:
        btn_line_idx = i

if nav_line_idx is None:
    print("ERROR: Could not find NAVIGATION comment")
    exit(1)
if btn_line_idx is None:
    print("ERROR: Could not find btn-primary-onboard button")
    exit(1)

print(f"Found NAVIGATION comment at line {nav_line_idx + 1}")
print(f"Found btn-primary-onboard at line {btn_line_idx + 1}")

# Build the validation banner block
validation_banner = """        {/* ── VALIDATION ERROR BANNER ── */}
        <AnimatePresence>
          {validationErrors.length > 0 && (
            <motion.div
              className="validation-banner"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="validation-banner-inner">
                <div className="validation-banner-icon">
                  <ShieldCheck size={20} />
                </div>
                <div className="validation-banner-content">
                  <div className="validation-banner-title">Please complete all required fields</div>
                  <ul className="validation-banner-list">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

"""

# Step 1: Fix the button line first (before line indices shift)
old_btn = 'className="btn-primary-onboard"'
new_btn = 'className={`btn-primary-onboard${validationErrors.length > 0 ? \' shake\' : \'\'}`}'
lines[btn_line_idx] = lines[btn_line_idx].replace(old_btn, new_btn)

# Step 2: Insert validation banner before the NAVIGATION comment
lines.insert(nav_line_idx, validation_banner)

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("SUCCESS: Validation banner inserted and button updated!")
print(f"Total lines after patch: {len(lines)}")
