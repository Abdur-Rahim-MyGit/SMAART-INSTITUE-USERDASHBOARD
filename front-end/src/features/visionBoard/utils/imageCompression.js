/**
 * Compresses an image File or Blob to a JPEG/PNG Data URL.
 * @param {File|Blob} file - The original image file
 * @param {number} maxWidth - The maximum width to allow
 * @param {number} maxHeight - The maximum height to allow
 * @param {number} quality - The JPEG quality (0.0 to 1.0)
 * @returns {Promise<string>} A promise that resolves to a compressed base64 Data URL
 */
export const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        
        // Preserve transparency for PNGs if possible, otherwise use JPEG for better compression
        const isPng = file.type === 'image/png';
        const mimeType = isPng ? 'image/png' : 'image/jpeg';
        
        if (!isPng) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
        }
        
        ctx.drawImage(img, 0, 0, width, height);

        // For PNG, quality param is ignored by most browsers, but doesn't hurt.
        // For JPEG, it significantly reduces size.
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};
