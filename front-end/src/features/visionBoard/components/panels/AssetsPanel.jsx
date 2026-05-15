import React, { useMemo, useState } from "react";
import { ImagePlus, Shapes, Sparkles, Sticker } from "lucide-react";
import { ASSET_LIBRARY_PACKS } from "../../utils/constants";

const sectionClass =
  "rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]";

const categories = ["All", "Shapes", "Badges", "Decor"];

const AssetsPanel = ({ userUploads, onUploadAsset, onAddAssetToCanvas, onAddUploadToCanvas }) => {
  const [activeCategory, setActiveCategory] = useState("All");

  const visibleAssets = useMemo(() => {
    if (activeCategory === "All") {
      return ASSET_LIBRARY_PACKS;
    }
    return ASSET_LIBRARY_PACKS.filter((asset) => asset.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="space-y-4">
      {/* <div className={sectionClass}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a3884]/10 text-[#1a3884] dark:bg-[#7aa2ff]/15 dark:text-[#9cb9ff]">
            <Sticker className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Asset Library
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-white/55">
              Add badges, shapes, decorative accents, and saved uploads as movable canvas assets.
            </p>
          </div>
        </div>
      </div> */}

      <div className={sectionClass}>
        <div className="mb-3 flex items-center gap-2">
          <ImagePlus className="h-4 w-4 text-slate-500 dark:text-white/50" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Saved Uploads
          </h3>
        </div>

        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 shadow-sm transition-all hover:border-[#1a3884]/40 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/[0.04] dark:text-white/65 dark:hover:border-white/20">
          <ImagePlus className="h-4 w-4" />
          Upload Asset
          <input type="file" accept="image/*" className="hidden" onChange={onUploadAsset} />
        </label>

        {userUploads.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {userUploads.map((upload, index) => (
              <button
                key={`${upload.id || "upload"}-${index}`}
                type="button"
                onClick={() => onAddUploadToCanvas(upload)}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_38px_-10px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="aspect-[4/3] bg-slate-100 dark:bg-white/[0.05]">
                  <img src={upload.src || upload} alt="Saved upload" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                </div>
                <div className="px-3 py-2">
                  <div className="truncate text-[11px] font-bold text-slate-700 dark:text-white/75">
                    {upload.name || `Upload ${index + 1}`}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55">
            Upload PNG or JPG assets here to build a reusable personal sticker tray.
          </div>
        )}
      </div>

      <div className={sectionClass}>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-slate-500 dark:text-white/50" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Creative Packs
          </h3>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {categories.map((category) => {
            const active = category === activeCategory;
            const Icon = category === "Shapes" ? Shapes : category === "Decor" ? Sparkles : Sticker;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${active
                    ? "border-[#1a3884]/50 bg-[#1a3884]/10 text-[#1a3884] dark:border-[#7aa2ff]/25 dark:bg-[#7aa2ff]/12 dark:text-[#9cb9ff]"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60"
                  }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {category}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {visibleAssets.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => onAddAssetToCanvas(asset)}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_38px_-10px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div className="flex aspect-[5/4] items-center justify-center bg-[radial-gradient(circle_at_top,#f8fafc_0%,#eff6ff_100%)] p-3 dark:bg-[radial-gradient(circle_at_top,#0f172a_0%,#081120_100%)]">
                <img src={asset.src} alt={asset.name} className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-110" />
              </div>
              <div className="px-3 py-2">
                <div className="truncate text-[11px] font-bold text-slate-800 dark:text-white/80">
                  {asset.name}
                </div>
                <div className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-white/45">
                  {asset.category}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssetsPanel;
