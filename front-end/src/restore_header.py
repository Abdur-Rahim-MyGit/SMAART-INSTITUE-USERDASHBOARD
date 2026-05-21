
import os

file_path = r"c:\Users\dhars\Desktop\SMAART-INSTITUTE\SMAART-INSTITUE-USERDASHBOARD\front-end\src\features\visionBoard\pages\VisionBoardGalleryPro.jsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white lg:text-4xl">
              Vision Board <span className="text-primary">Library</span>
            </h1>

            <Button
              onClick={handleCreateNew}
              disabled={!canCreateMore}
              className={`h-[52px] rounded-[18px] px-8 text-sm font-bold tracking-wide shadow-lg transition-all active:scale-95 ${canCreateMore
                ? "bg-primary text-white hover:bg-primary/90 hover:shadow-primary/30"
                : "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800"
                }`}
            >
              <Plus className="mr-2 h-5 w-5" />
              Create New Board
            </Button>
          </div>"""

replacement = """          <div className="relative flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#1a3884] shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                <div className="h-2 w-2 rounded-full bg-[#1a3884] shadow-[0_0_8px_rgba(26,56,132,0.4)]" />
                Vision Journey
              </div>
              <div className="space-y-3">
                <h1 className="text-2xl font-black leading-tight tracking-tight text-slate-900 dark:text-white md:text-3xl lg:text-4xl">
                  Vision Board <span className="text-primary">Library</span>
                </h1>
                <p className="max-w-2xl text-[14px] font-medium leading-relaxed text-slate-500 dark:text-slate-400 md:text-[16px]">
                  Experience a focused visual journey. Create detailed boards for your goals,
                  track your aspirations with clarity, and keep your primary vision active
                  on your dashboard to stay inspired.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 xl:pb-1">
              <div className="inline-flex items-center gap-2 rounded-[18px] border border-slate-100 bg-slate-50/50 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                <Grid3X3 className="h-3.5 w-3.5 text-primary" />
                {boards.length} / {maxAllowed} slots
              </div>
              <Button
                onClick={handleCreateNew}
                disabled={!canCreateMore}
                className={`h-[52px] rounded-[18px] px-8 text-sm font-bold tracking-wide shadow-lg transition-all active:scale-95 ${canCreateMore
                  ? "bg-primary text-white hover:bg-primary/90 hover:shadow-primary/30"
                  : "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800"
                  }`}
              >
                <Plus className="mr-2 h-5 w-5" />
                Create New Board
              </Button>
            </div>
          </div>"""

# Try direct replacement first
if target in content:
    content = content.replace(target, replacement)
    print("Replaced direct string match.")
else:
    # If not found, use a regex to match the block ignoring exact whitespaces
    import re
    # Convert target to a regex pattern that ignores whitespace differences
    pattern = re.escape(target)
    pattern = re.sub(r'\\\s+', r'\\s+', pattern)
    
    if re.search(pattern, content):
        content = re.sub(pattern, replacement, content)
        print("Replaced regex match.")
    else:
        print("Error: Could not find the target content to replace.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
