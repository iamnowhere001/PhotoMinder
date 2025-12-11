
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

// Minimal EXIF parser to get DateTimeOriginal (0x9003) with robust bounds checking
export const getExifDate = async (file: File): Promise<number | undefined> => {
  // Only process JPEGs for now
  if (file.type !== 'image/jpeg' && file.type !== 'image/jpg') return undefined;

  try {
    const buffer = await file.slice(0, 65536).arrayBuffer(); // Read first 64KB
    const view = new DataView(buffer);
    const length = view.byteLength;

    // Check for JPEG SOI marker (0xFFD8)
    if (length < 2 || view.getUint16(0, false) !== 0xFFD8) return undefined;

    let offset = 2;

    while (offset < length - 1) { // Need at least 2 bytes for marker
      const marker = view.getUint16(offset, false);
      
      // If SOS (Start of Scan), EXIF is definitely over or we reached image data
      if (marker === 0xFFDA) return undefined; 

      // 0xFFE1 is APP1 (EXIF)
      if (marker !== 0xFFE1) {
        // Validation check for length field at offset + 2
        if (offset + 4 > length) return undefined; 
        
        const segmentLength = view.getUint16(offset + 2, false);
        // segmentLength includes the 2 bytes of the length field
        // So next marker is at offset + 2 + segmentLength
        
        offset += 2 + segmentLength;
        continue;
      }

      // Found APP1 (0xFFE1)
      if (offset + 4 > length) return undefined;
      const segmentLength = view.getUint16(offset + 2, false);
      
      // Check if segment is fully within buffer
      if (offset + 2 + segmentLength > length) {
          // EXIF data truncated, can't parse safely
          return undefined;
      }

      // Check for "Exif" header (0x45786966) + 2 null bytes (0x0000)
      // Header is 6 bytes: Exif\0\0
      const exifHeaderOffset = offset + 4;
      if (exifHeaderOffset + 6 > length) return undefined;
      
      if (view.getUint32(exifHeaderOffset, false) !== 0x45786966) {
        return undefined; // Not an Exif segment
      }
      if (view.getUint16(exifHeaderOffset + 4, false) !== 0x0000) {
        return undefined;
      }

      // TIFF Header follows Exif Header
      const tiffOffset = exifHeaderOffset + 6;
      if (tiffOffset + 8 > length) return undefined;

      // Byte order (II: 0x4949 or MM: 0x4D4D)
      const byteOrder = view.getUint16(tiffOffset, false);
      const littleEndian = byteOrder === 0x4949;
      
      // 0x002A check (42)
      if (view.getUint16(tiffOffset + 2, littleEndian) !== 0x002A) {
          return undefined;
      }
      
      const firstIFDOffset = view.getUint32(tiffOffset + 4, littleEndian);
      if (firstIFDOffset < 0x00000008) return undefined;

      let ifdOffset = tiffOffset + firstIFDOffset;
      
      // Validate IFD offset
      if (ifdOffset + 2 > length) return undefined;
      
      const entries = view.getUint16(ifdOffset, littleEndian);
      
      // Loop through directory entries
      for (let i = 0; i < entries; i++) {
        const entryOffset = ifdOffset + 2 + (i * 12);
        
        // Check bounds for entry (12 bytes per entry)
        if (entryOffset + 12 > length) return undefined;

        const tag = view.getUint16(entryOffset, littleEndian);
        
        // 0x9003 is DateTimeOriginal
        if (tag === 0x9003) {
           const type = view.getUint16(entryOffset + 2, littleEndian);
           const count = view.getUint32(entryOffset + 4, littleEndian);
           
           // Value/Offset is 4 bytes at entryOffset + 8
           const dataOffset = view.getUint32(entryOffset + 8, littleEndian);
           
           // Type 2 is ASCII string. Count 20 is standard "YYYY:MM:DD HH:MM:SS\0"
           if (type === 2 && count === 20) { 
             const dateStringOffset = tiffOffset + dataOffset;
             
             // Check bounds for string data
             if (dateStringOffset + 20 > length) return undefined;

             let dateStr = "";
             for(let j=0; j<19; j++) {
                dateStr += String.fromCharCode(view.getUint8(dateStringOffset + j));
             }
             
             // Check if it looks like a date (simplistic check)
             if (dateStr.includes(':')) {
                 const isoStr = dateStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3').replace(' ', 'T');
                 const timestamp = new Date(isoStr).getTime();
                 return isNaN(timestamp) ? undefined : timestamp;
             }
           }
        }
      }
      return undefined; // Tag not found in first IFD
    }
    return undefined;
  } catch (e) {
    // Avoid logging object if possible to prevent "[object Object]" logs
    console.error("Error parsing EXIF", (e as Error).message || e);
    return undefined;
  }
};

// --- New Helper for macOS-style Date Grouping ---
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
