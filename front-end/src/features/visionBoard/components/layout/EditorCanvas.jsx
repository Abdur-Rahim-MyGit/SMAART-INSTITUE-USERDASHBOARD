import React, { useRef } from "react";
import ImageSlot from "../editor/ImageSlot";
import TextOverlay from "../editor/TextOverlay";

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
  selectedSlot,
  setSelectedSlot,
  textOverlays,
  selectedTextId,
  setSelectedTextId,
  handleSelectText,
  handleUpdateText,
  zoomLevel
}) => {
  return (
    <div className="flex-1 overflow-auto bg-[#e5e7eb] dark:bg-[#0f172a] relative flex items-center justify-center p-8 pb-28 lg:pb-8 custom-scrollbar">
      {/* Canvas Wrapper for Zoom/Pan */}
      <div 
        className="relative transition-all duration-200 ease-out custom-shadow origin-top-left flex-shrink-0"
        style={{
            width: displayWidth * (zoomLevel / 100),
            height: displayHeight * (zoomLevel / 100),
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
                className="w-full h-full relative bg-white shadow-2xl overflow-hidden custom-canvas-border"
                style={{
                    backgroundColor,
                    borderRadius: `${Math.min(borderRadius, 32)}px`,
                    borderColor: backgroundColor === '#FFFFFF' ? '#e2e8f0' : backgroundColor,
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSlot(null);
                    setSelectedTextId(null);
                }}
            >
                {/* Google Fonts for canvas */}
                <link
                    href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Dancing+Script:wght@400;700&family=Pacifico&family=Great+Vibes&family=Montserrat:wght@200;400;700;900&family=Oswald:wght@400;700&family=Anton&family=Bebas+Neue&family=Raleway:wght@200;400&family=Quicksand:wght@300;400;500&family=Poppins:wght@300;400;500;600&family=Inter:wght@300;400;500&family=Permanent+Marker&family=Indie+Flower&family=Amatic+SC:wght@400;700&family=Special+Elite&family=Lobster&family=Righteous&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Poiret+One&family=Sacramento&family=Satisfy&display=swap"
                    rel="stylesheet"
                />

                {/* Background Image Layer */}
                {backgroundImage && (
                    <img
                        src={backgroundImage}
                        alt="Background"
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        style={{ zIndex: 0 }}
                    />
                )}

                {/* Image Slots */}
                {currentTemplate.slots.map((slot) => (
                    <ImageSlot
                        key={slot.id}
                        slot={slot}
                        image={images[slot.id]}
                        gap={gap}
                        borderRadius={borderRadius}
                        isSelected={selectedSlot === slot.id}
                        onSelect={(id) => {
                            setSelectedSlot(id);
                            setSelectedTextId(null);
                        }}
                        onImageUpload={handleImageUpload}
                        onImageUpdate={handleImageUpdate}
                        onImageRemove={handleImageRemove}
                    />
                ))}

                {/* Text Overlays */}
                {Object.entries(textOverlays).map(([id, overlay]) => (
                    <TextOverlay
                        key={id}
                        overlay={overlay}
                        isSelected={selectedTextId === id}
                        onSelect={() => handleSelectText(id)}
                        onUpdate={(updates) => handleUpdateText(id, updates)}
                        canvasWidth={displayWidth}
                        canvasHeight={displayHeight}
                        canvasRef={canvasRef}
                    />
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default EditorCanvas;
