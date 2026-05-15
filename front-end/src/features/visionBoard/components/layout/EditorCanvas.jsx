import React from "react";
import ImageSlot from "../editor/ImageSlot";
import TextOverlay from "../editor/TextOverlay";
import AssetOverlay from "../editor/AssetOverlay";

const EditorCanvas = ({
  canvasRef,
  displayWidth,
  displayHeight,
  backgroundColor,
  backgroundImage,
  borderRadius,
  gap,
  currentTemplate,
  images,
  handleImageUpload,
  handleImageUpdate,
  handleImageRemove,
  clearSelection,
  selectedLayers,
  setSelectedLayers,
  textOverlays,
  assetOverlays,
  setSelectedTextId,
  handleSelectText,
  handleSelectAsset,
  handleSelectLayer,
  handleUpdateText,
  handleUpdateAsset,
  zoomLevel,
  snapEnabled,
  guideState,
  setGuideState,
  handleDeleteText,
  handleDeleteAsset,
}) => {
  const overlayPeers = [
    ...Object.entries(textOverlays || {})
      .filter(([, overlay]) => !overlay.hidden)
      .map(([id, overlay]) => ({
        id,
        type: "text",
        x: overlay.position?.x || 50,
        y: overlay.position?.y || 50,
      })),
    ...Object.entries(assetOverlays || {})
      .filter(([, asset]) => !asset.hidden)
      .map(([id, asset]) => ({
        id,
        type: "asset",
        x: asset.position?.x || 50,
        y: asset.position?.y || 50,
      })),
  ];

  return (
    <div className="custom-scrollbar relative flex flex-1 items-center justify-center overflow-auto bg-[radial-gradient(circle_at_top,#eff6ff_0%,#f8fafc_36%,#eef2f7_100%)] p-4 pb-36 dark:bg-[radial-gradient(circle_at_top,#172554_0%,#0b1220_28%,#040814_100%)] sm:p-5 sm:pb-36 lg:p-8 lg:pb-10">
      <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:32px_32px] dark:opacity-20" />
      <div className="absolute left-4 top-4 hidden rounded-xl border border-white/60 bg-white/70 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-600 shadow-md backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-slate-300 lg:block xl:left-6 xl:top-6">
        Studio Preview
      </div>

      <div 
        className="relative flex-shrink-0 origin-top-left transition-all duration-300 ease-out"
        style={{
            width: displayWidth * (zoomLevel / 100),
            height: displayHeight * (zoomLevel / 100),
            maxWidth: "100%",
            maxHeight: "100%",
        }}
      >
        <div
            className="absolute top-0 left-0 origin-top-left"
            style={{
                transform: `scale(${zoomLevel / 100})`,
                width: displayWidth,
                height: displayHeight,
            }}
        >
            <div
                ref={canvasRef}
                className="relative h-full w-full overflow-hidden border border-slate-200/80 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.15)] transition-all duration-300 dark:border-slate-700/60 custom-canvas-border"
                style={{
                    backgroundColor,
                    borderRadius: `${Math.min(borderRadius, 32)}px`,
                    borderColor: backgroundColor === '#FFFFFF' ? '#e2e8f0' : backgroundColor,
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    clearSelection();
                    setGuideState({ vertical: false, horizontal: false });
                }}
            >
                {backgroundImage && (
                    <img
                        src={backgroundImage}
                        alt="Background"
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        style={{ zIndex: 0 }}
                    />
                )}

                {currentTemplate.slots.map((slot) => (
                    <ImageSlot
                        key={slot.id}
                        slot={slot}
                        image={images[slot.id]}
                        gap={gap}
                        borderRadius={borderRadius}
                        isSelected={selectedLayers.some((entry) => entry.type === "image" && entry.id === slot.id)}
                        onSelect={(id, additive) => {
                            handleSelectLayer(id, "image", additive);
                        }}
                        onImageUpload={handleImageUpload}
                        onImageUpdate={handleImageUpdate}
                        onImageRemove={handleImageRemove}
                        snapEnabled={snapEnabled}
                        onGuideChange={setGuideState}
                    />
                ))}

                {Object.entries(textOverlays)
                  .filter(([, overlay]) => !overlay.hidden)
                  .map(([id, overlay]) => (
                    <TextOverlay
                        key={id}
                        overlay={overlay}
                        isSelected={selectedLayers.some((entry) => entry.type === "text" && entry.id === id)}
                        onSelect={(additive) => handleSelectText(id, additive)}
                        onUpdate={(updates) => handleUpdateText(id, updates)}
                        canvasRef={canvasRef}
                        snapEnabled={snapEnabled}
                        peers={overlayPeers}
                        overlayType="text"
                        overlayId={id}
                        onGuideChange={setGuideState}
                        onDelete={() => handleDeleteText(id)}
                    />
                ))}

                {Object.entries(assetOverlays || {})
                  .filter(([, asset]) => !asset.hidden)
                  .map(([id, asset]) => (
                    <AssetOverlay
                        key={id}
                        asset={asset}
                        isSelected={selectedLayers.some((entry) => entry.type === "asset" && entry.id === id)}
                        onSelect={(additive) => handleSelectAsset(id, additive)}
                        onUpdate={(updates) => handleUpdateAsset(id, updates)}
                        canvasRef={canvasRef}
                        snapEnabled={snapEnabled}
                        peers={overlayPeers}
                        overlayType="asset"
                        overlayId={id}
                        onGuideChange={setGuideState}
                        onDelete={() => handleDeleteAsset(id)}
                    />
                ))}

                {(guideState?.vertical || guideState?.horizontal || guideState?.spacingX || guideState?.spacingY) && (
                  <div className="pointer-events-none absolute inset-0 z-[120]">
                    {guideState.vertical && (
                      <div className="absolute bottom-0 top-0 left-1/2 w-px -translate-x-1/2 bg-[#1a3884]/60" />
                    )}
                    {guideState.horizontal && (
                      <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-[#1a3884]/60" />
                    )}
                    {(guideState.spacingX || guideState.spacingY) && (
                      <div className="absolute right-3 top-3 flex flex-col gap-1">
                        {guideState.spacingX ? (
                          <div className="rounded-xl bg-[#0f172a]/92 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-xl backdrop-blur-xl border border-white/10">
                            X Gap {guideState.spacingX}px
                          </div>
                        ) : null}
                        {guideState.spacingY ? (
                          <div className="rounded-xl bg-[#0f172a]/92 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-xl backdrop-blur-xl border border-white/10">
                            Y Gap {guideState.spacingY}px
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default EditorCanvas;
