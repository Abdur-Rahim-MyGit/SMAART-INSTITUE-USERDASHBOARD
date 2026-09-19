import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';

/**
 * Removes the background from an image file or DataURL/Blob.
 * @param {File|Blob|string} imageSource - The source image (File, Blob, or base64 URL/Data URL)
 * @returns {Promise<string>} A promise that resolves to a base64 DataURL of the image with the background removed.
 */
export async function removeBackground(imageSource) {
  try {
    const config = {
      publicPath: "https://static.imgly.com/@imgly/background-removal-data/1.4.3/dist/",
      progress: (key, current, total) => {
        console.log(`Downloading background removal model: ${key} - ${current}/${total}`);
      },
    };
    
    // removeBackground returns a Blob
    const blob = await imglyRemoveBackground(imageSource, config);
    
    // Convert Blob to Data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error removing background:", error);
    throw error;
  }
}
