
import { ExifData } from './types';

export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const formatDate = (timestamp: number) => {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

// Robust EXIF parser using ExifReader library (Dynamic Import)
export const getExifData = async (file: File): Promise<{ dateTaken?: number; exif?: ExifData }> => {
  // Supports JPEG, PNG, HEIC, WEBP, TIFF
  try {
    // Dynamically import ExifReader to avoid top-level load issues
    // @ts-ignore
    const ExifReaderModule = await import('exifreader');
    const ExifReader = ExifReaderModule.default || ExifReaderModule;

    const tags = await ExifReader.load(file);
    
    let dateTaken: number | undefined;

    // Try standard DateTimeOriginal
    const dateOriginal = tags['DateTimeOriginal']?.description;
    if (dateOriginal) {
       // Format is typically "YYYY:MM:DD HH:MM:SS"
       const parts = dateOriginal.split(/[: ]/);
       if (parts.length >= 6) {
           const [y, m, d, h, min, s] = parts;
           const dateObj = new Date(
               parseInt(y), 
               parseInt(m) - 1, 
               parseInt(d), 
               parseInt(h), 
               parseInt(min), 
               parseInt(s)
           );
           if (!isNaN(dateObj.getTime())) {
               dateTaken = dateObj.getTime();
           }
       }
    }

    // Extract useful camera info
    const exif: ExifData = {
        make: tags['Make']?.description,
        model: tags['Model']?.description,
        exposureTime: tags['ExposureTime']?.description, // e.g. "1/60"
        fNumber: tags['FNumber']?.description, // e.g. "f/2.8"
        iso: tags['ISOSpeedRatings']?.description, // e.g. "100"
        focalLength: tags['FocalLength']?.description, // e.g. "50mm"
        lensModel: tags['LensModel']?.description,
    };

    return { dateTaken, exif };

  } catch (e) {
    console.warn("EXIF extraction failed:", e);
    return {};
  }
};

// --- Helper for macOS-style Date Grouping ---
export const groupPhotosByDate = (photos: any[]) => {
  const groups: Record<string, any[]> = {};
  
  photos.forEach(photo => {
    const date = new Date(photo.dateTaken || photo.lastModified);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key = 'Unknown Date';
    if (!isNaN(date.getTime())) {
         if (date.toDateString() === today.toDateString()) {
           key = 'Today';
         } else if (date.toDateString() === yesterday.toDateString()) {
           key = 'Yesterday';
         } else {
           key = date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
         }
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(photo);
  });

  return groups;
};
