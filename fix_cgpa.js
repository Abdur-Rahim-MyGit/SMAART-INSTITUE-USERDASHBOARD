const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'front-end', 'src', 'pages', 'CGPACalculator.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// The duplicated block starts exactly at:
const searchString = `                      return (
  const deleteHistoryItem = (id, e) => {`;

const startIndex = content.indexOf(searchString);

if (startIndex !== -1) {
  // The duplication ends right before:
  const endString = `      {/* --- GUIDE MODAL --- */}`;
  const endIndex = content.indexOf(endString, startIndex);
  
  if (endIndex !== -1) {
    const cleanHistoryItem = `                      return (
                        <div
                          key={item.id}
                          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-[#1a3884] hover:shadow-md dark:border-slate-700 dark:bg-[#001024] dark:hover:border-blue-500"
                          onClick={() => loadHistoryItem(item)}
                        >
                          <div className="mb-2 flex items-center justify-between relative z-10">
                            <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              {item.date}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-semibold text-blue-500">{item.method}</span>
                            </div>
                          </div>
                          <div className="flex items-baseline gap-2 relative z-10">
                            <span className="text-3xl font-black text-[#0d1f4e] dark:text-white">{item.cgpa.toFixed(2)}</span>
                            <span className="text-sm font-semibold text-slate-400">CGPA</span>
                          </div>
                          <p className="mt-2 text-[11px] text-slate-500 relative z-10">
                            {totalSubjects} subjects recorded
                          </p>
                          
                          {/* Delete Button (Visible on Hover) */}
                          <button
                            onClick={(e) => deleteHistoryItem(item.id, e)}
                            className="absolute right-3 bottom-3 z-20 flex items-center justify-center rounded-lg bg-red-50 p-2 text-red-500 opacity-0 transition-all hover:bg-red-100 group-hover:opacity-100 dark:bg-red-900/20 dark:hover:bg-red-900/40"
                            title="Delete Saved Result"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
                          </button>

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-[#1a3884]/95 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
                            <span className="font-bold text-white">Load Calculation</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

`;

    // We also need to insert deleteHistoryItem at the top of the component
    let newContent = content.substring(0, startIndex) + cleanHistoryItem + content.substring(endIndex);
    
    // Now insert deleteHistoryItem before handleSaveResult
    const funcInsert = `  const deleteHistoryItem = (id, e) => {
    e.stopPropagation();
    const newHistory = history.filter((item) => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem("smaart_cgpa_history", JSON.stringify(newHistory));
  };

  const handleSaveResult`;
    
    newContent = newContent.replace('  const handleSaveResult', funcInsert);
    
    // Replace the raw SVG with IconTrash if needed, but since IconTrash is already imported, we can just use <IconTrash size={16} />.
    newContent = newContent.replace('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>', '<IconTrash size={16} />');

    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log("Successfully fixed CGPACalculator.jsx and added the delete feature!");
  } else {
    console.log("Could not find end index");
  }
} else {
  console.log("Could not find start index");
}
