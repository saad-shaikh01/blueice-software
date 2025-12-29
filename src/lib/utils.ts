import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// import Quill from 'quill';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// export function renderQuillDeltaToHtml(deltaString: string): string {
//   try {
//     const container = document.createElement('div');
//     const quill = new Quill(container);
//     quill.setContents(JSON.parse(deltaString));
//     return quill.root.innerHTML;
//   } catch (error) {
//     console.error('Error parsing delta:', error);
//     return '';
//   }
// }

export function getAvatarColor(name: string) {
  const colors = [
    'bg-red-500',
    'bg-green-500',
    'bg-blue-500',
    'bg-yellow-500',
    'bg-indigo-500',
    'bg-pink-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-rose-500',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function truncate(str: string, maxLength: number) {
  return str.length > maxLength ? str.slice(0, maxLength - 1) + '…' : str;
}

export function generateInviteCode(length: number) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  let result = '';

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
}

export function snakeCaseToTitleCase(str: string) {
  return str
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function extractMentions(content: string): string[] {
  const mentions = content.match(/@\[([^\]]+)\]\(([^)]+)\)/g) || [];
  return mentions.map((mention) => {
    const match = mention.match(/@\[([^\]]+)\]\(([^)]+)\)/);
    return match ? match[2] : '';
  });
}

// utils/getImageUrl.js
export function getImageUrl(imageName: string) {
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || 'https://your-default-base-url.com';
  return `${baseUrl}/${imageName}`;
}

export const downloadFile = async (url: string, filename: string): Promise<void> => {
  try {
    const response = await fetch(url);

    // Check if the fetch was successful
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
    }

    // Convert the response to a blob
    const blob = await response.blob();

    // Create a blob URL
    const blobUrl = URL.createObjectURL(blob);

    // Create a link element
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;

    // Append to body, click the link, and remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the blob URL
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
};

export const validFileTypes = [
  // Images
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',

  // Documents
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx

  // PowerPoint
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx

  // Excel
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx

  // Zip and compressed files
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed',

  // Videos
  'video/mp4',
  'video/x-msvideo', // .avi
  'video/x-matroska', // .mkv
  'video/webm',
  'video/quicktime', // .mov
  'video/mpeg', // .mpeg
  'video/x-flv', // .flv
  'video/3gpp', // .3gp
  'video/x-m4v', // .m4v

  // Audio
  'audio/mpeg', // .mp3
  'audio/wav', // .wav
  'audio/ogg', // .ogg
  'audio/aac', // .aac
  'audio/mp4', // .m4a

  // Text & Code
  'text/plain', // .txt, .log, .env
  'text/csv', // .csv
  'application/json', // .json
  'application/xml', // .xml
  'text/html', // .html
  'text/css', // .css
  'application/javascript', // .js
  'application/typescript', // .ts
  'text/markdown', // .md
  'application/x-yaml', // .yaml, .yml

  // Design & Creative
  'image/vnd.adobe.photoshop', // .psd
  'application/postscript', // .ai, .eps
  'application/octet-stream', // .sketch (generic binary MIME)
];

// export const downloadFile = (url: string, filename: string) => {
//   const link = document.createElement("a");
//   link.href = url;
//   link.download = filename;
//   document.body.appendChild(link);
//   link.click();
//   document.body.removeChild(link);
// };
