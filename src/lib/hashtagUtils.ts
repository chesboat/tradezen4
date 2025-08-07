/**
 * Utility functions for hashtag management
 */

/**
 * Extract hashtags from text content
 */
export function extractHashtags(content: string): string[] {
  const hashtagRegex = /#([a-zA-Z0-9_-]+)/g;
  const hashtags: string[] = [];
  let match;
  
  while ((match = hashtagRegex.exec(content)) !== null) {
    const tag = match[1].toLowerCase();
    if (!hashtags.includes(tag)) {
      hashtags.push(tag);
    }
  }
  
  return hashtags;
}

/**
 * Remove hashtags from content while preserving the rest of the text
 */
export function cleanHashtagsFromContent(content: string): string {
  const hashtagRegex = /#([a-zA-Z0-9_-]+)/g;
  return content.replace(hashtagRegex, '').replace(/\s+/g, ' ').trim();
}

/**
 * Convert hashtags back to text format (for editing)
 */
export function addHashtagsToContent(content: string, tags: string[]): string {
  if (!tags || tags.length === 0) return content;
  const hashtagText = tags.map(tag => `#${tag}`).join(' ');
  return `${content} ${hashtagText}`.trim();
}

/**
 * Validate hashtag format
 */
export function isValidHashtag(tag: string): boolean {
  const hashtagRegex = /^[a-zA-Z0-9_-]+$/;
  return hashtagRegex.test(tag) && tag.length > 0 && tag.length <= 50;
}