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

// Minimal EXIF parser to get DateTimeOriginal (0x9003)
export const getExifDate = async (file: File): Promise<number | undefined> => {
  // Only process JPEGs for now
  if (file.type !== 'image/jpeg' && file.type !== 'image/jpg') return undefined;

  try {
    const buffer = await file.slice(0, 65536).arrayBuffer(); // Read first 64KB
    const view = new DataView(buffer);

    if (view.getUint16(0, false) !== 0xFFD8) return undefined; // Not JPEG

    const length = view.byteLength;
    let offset = 2;

    while (offset < length) {
      if (view.getUint16(offset, false) !== 0xFFE1) {
        // Not APP1, skip
        offset += 2 + view.getUint16(offset + 2, false);
        continue;
      }

      // Check for "Exif" header
      if (view.getUint32(offset + 4, false) !== 0x45786966) {
        return undefined;
      }

      const littleEndian = view.getUint16(offset + 10, false) === 0x4949;
      const tiffOffset = offset + 10;
      
      const firstIFDOffset = view.getUint32(tiffOffset + 4, littleEndian);
      if (firstIFDOffset < 0x00000008) return undefined;

      let ifdOffset = tiffOffset + firstIFDOffset;
      const entries = view.getUint16(ifdOffset, littleEndian);
      
      // Loop through directory entries
      for (let i = 0; i < entries; i++) {
        const entryOffset = ifdOffset + 2 + (i * 12);
        const tag = view.getUint16(entryOffset, littleEndian);
        
        // 0x9003 is DateTimeOriginal
        if (tag === 0x9003) {
           const type = view.getUint16(entryOffset + 2, littleEndian);
           const count = view.getUint32(entryOffset + 4, littleEndian);
           const dataOffset = view.getUint32(entryOffset + 8, littleEndian);
           
           if (type === 2 && count === 20) { // ASCII string, length 20
             // Read the string
             const dateStringOffset = tiffOffset + dataOffset;
             let dateStr = "";
             for(let j=0; j<19; j++) {
                dateStr += String.fromCharCode(view.getUint8(dateStringOffset + j));
             }
             // Exif format: "YYYY:MM:DD HH:MM:SS"
             // Convert to: "YYYY-MM-DDTHH:MM:SS" for Date parsing
             const isoStr = dateStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3').replace(' ', 'T');
             const timestamp = new Date(isoStr).getTime();
             return isNaN(timestamp) ? undefined : timestamp;
           }
        }
        
        // 0x8769 is ExifOffset (pointer to SubIFD) - simplified: we usually find 0x9003 in standard IFD or SubIFD.
        // For a robust full parser we need to traverse SubIFDs, but this covers many standard cases.
      }
      break; 
    }
    return undefined;
  } catch (e) {
    console.error("Error parsing EXIF", e);
    return undefined;
  }
};