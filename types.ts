
export interface ExifData {
  make?: string;
  model?: string;
  exposureTime?: string;
  fNumber?: string;
  iso?: string;
  focalLength?: string;
  lensModel?: string;
}

export interface Photo {
  id: string;
  file: File;
  fileHandle?: any; // FileSystemFileHandle
  name: string; // Mutable name for renaming
  url: string;
  size: number;
  type: string;
  lastModified: number; // File Modification Date
  dateTaken?: number;   // EXIF Content Creation Date
  exif?: ExifData;      // Detailed EXIF metadata
  dimensions?: { width: number; height: number };
  aiDescription?: string;
  aiTags?: string[];
  isFavorite: boolean;
}

export type SortKey = 'name' | 'size' | 'dateModified' | 'dateTaken';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export type ViewMode = 'grid' | 'list';

export interface RenameConfig {
  prefix: string;
  startNumber: number;
  suffix: string;
}

export interface RenameOptions {
  mode: 'sequence' | 'replace';
  prefix?: string;
  startNumber?: number;
  findText?: string;
  replaceText?: string;
  useRegex?: boolean;
}
