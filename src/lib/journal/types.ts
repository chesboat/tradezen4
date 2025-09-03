export type TextBlock = { type: 'text'; content: string };

export type ImageBlock = {
  type: 'image';
  url: string; // permanent HTTPS Blob URL
  alt?: string;
  width?: number;
  height?: number;
};

export type JournalBlock = TextBlock | ImageBlock;


