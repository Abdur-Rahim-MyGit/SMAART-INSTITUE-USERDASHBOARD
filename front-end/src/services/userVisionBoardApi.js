/**
 * User Vision Board API Service
 * Simple gallery with max 3 images per user
 */

import { apiCall, API_BASE_URL } from './api';

const API_ENDPOINT = '/user-vision-board';

/**
 * Convert file to base64
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Get user's gallery
 */
export const getGallery = async () => {
  const result = await apiCall(API_ENDPOINT);
  return result.data; // Return the gallery data
};

/**
 * Upload image to gallery
 * @param {File} file - Image file to upload
 * @param {Object} metadata - Optional metadata (title, description)
 */
export const uploadImage = async (file, metadata = {}) => {
  // Convert file to base64
  const base64Image = await fileToBase64(file);

  return apiCall(`${API_ENDPOINT}/upload`, {
    method: "POST",
    body: JSON.stringify({
      image: base64Image,
      title: metadata.title || "",
      description: metadata.description || "",
    }),
  });
};

/**
 * Update image metadata
 * @param {string} imageId - Image ID
 * @param {Object} updates - Fields to update (title, description)
 */
export const updateImage = async (imageId, updates) => {
  return apiCall(`${API_ENDPOINT}/image/${imageId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
};

/**
 * Delete image from gallery
 * @param {string} imageId - Image ID to delete
 */
export const deleteImage = async (imageId) => {
  return apiCall(`${API_ENDPOINT}/image/${imageId}`, {
    method: "DELETE",
  });
};

/**
 * Reorder images in gallery
 * @param {Array<string>} imageIds - Array of image IDs in new order
 */
export const reorderImages = async (imageIds) => {
  return apiCall(`${API_ENDPOINT}/reorder`, {
    method: "PUT",
    body: JSON.stringify({ imageIds }),
  });
};

/**
 * Update gallery settings
 * @param {Object} settings - Settings to update
 */
export const updateSettings = async (settings) => {
  return apiCall(`${API_ENDPOINT}/settings`, {
    method: "PUT",
    body: JSON.stringify(settings),
  });
};

/**
 * Get optimized image URL based on context
 * @param {Object} image - Image object with tier URLs
 * @param {string} tier - 'original', 'web', 'mobile', or 'thumbnail'
 */
export const getOptimizedUrl = (image, tier = "web") => {
  if (!image) return "";

  // Try optimized versions first
  if (tier === "web" && image.optimized?.web) return image.optimized.web;
  if (tier === "mobile" && image.optimized?.mobile)
    return image.optimized.mobile;
  if (tier === "thumbnail" && image.optimized?.thumbnail)
    return image.optimized.thumbnail;

  // Fall back to original
  if (image.original?.url) return image.original.url;

  return "";
};

/**
 * Get image info for display
 * @param {Object} image - Image object
 * @param {string} tier - Tier to get info for
 */
export const getImageInfo = (image, tier = "original") => {
  if (!image) return { url: "", format: "", size: 0 };

  if (tier === "original" && image.original) {
    return {
      url: image.original.url,
      format: image.original.format,
      size: image.original.size,
    };
  }

  // For optimized tiers, we only have URLs
  if (image.optimized?.[tier]) {
    return {
      url: image.optimized[tier],
      format: "webp",
      size: null, // Size not tracked for optimized versions
    };
  }

  return { url: image.original?.url || "", format: "", size: 0 };
};
