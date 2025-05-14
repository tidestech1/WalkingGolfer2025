import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

import { storage } from './firebase'

/**
 * Upload an image to Firebase Storage
 * @param file The file to upload
 * @param folderPath The folder path to store the file at (default: 'news')
 * @returns The download URL of the uploaded file
 */
export async function uploadImage(
  file: File, 
  folderPath = 'news'
): Promise<string> {
  try {
    // Check if storage is available
    if (!storage) {
      throw new Error('Firebase storage is not initialized')
    }
    
    // Sanitize and create a unique filename
    const timestamp = Date.now();
    // Replace characters not allowed by isValidPath and also common problematic ones like spaces
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9-_.]/g, '_').replace(/\s+/g, '_');
    const uniqueFileName = `${timestamp}-${sanitizedFileName}`;
    
    // Construct the full path including the folder and the unique filename
    const fullStoragePath = `${folderPath}/${uniqueFileName}`;
    
    // Create a reference to the file location using the full path.
    const storageRef = ref(storage, fullStoragePath)
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file)
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref)
    
    return downloadURL
  } catch (error) {
    console.error('Error uploading image:', error)
    throw new Error('Failed to upload image')
  }
}

/**
 * Delete an image from Firebase Storage
 * @param url The URL of the image to delete
 * @returns A boolean indicating success
 */
export async function deleteImage(url: string): Promise<boolean> {
  try {
    // Check if storage is available
    if (!storage) {
      console.error('Firebase storage is not initialized')
      return false
    }
    
    // Extract the path from the URL
    // Firebase storage URLs have a format like:
    // https://firebasestorage.googleapis.com/v0/b/[bucket]/o/[path]?alt=media&token=[token]
    const decodedUrl = decodeURIComponent(url)
    const startIndex = decodedUrl.indexOf('/o/') + 3
    const endIndex = decodedUrl.indexOf('?', startIndex)
    
    if (startIndex === -1 || endIndex === -1) {
      console.error('Invalid Firebase Storage URL format')
      return false
    }
    
    const path = decodedUrl.substring(startIndex, endIndex)
    const storageRef = ref(storage, path)
    
    // Delete the file
    await deleteObject(storageRef)
    
    return true
  } catch (error) {
    console.error('Error deleting image:', error)
    return false
  }
}

/**
 * Extract a filename from a Firebase Storage URL
 * @param url The URL to extract the filename from
 * @returns The filename
 */
export function getFilenameFromURL(url: string): string {
  try {
    const decodedUrl = decodeURIComponent(url)
    const startIndex = decodedUrl.indexOf('/o/') + 3
    const endIndex = decodedUrl.indexOf('?', startIndex)
    
    if (startIndex === -1 || endIndex === -1) {
      return 'unknown-file'
    }
    
    const path = decodedUrl.substring(startIndex, endIndex)
    const fileName = path.split('/').pop() || 'unknown-file'
    
    return fileName
  } catch (_error) {
    return 'unknown-file'
  }
} 