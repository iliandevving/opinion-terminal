/**
 * Slug utilities for URL-friendly market identifiers
 */

/**
 * Generate a URL-friendly slug from a market title and ID
 * Format: "market-title-words-123" where 123 is the market ID
 */
export function generateMarketSlug(title: string, marketId: number): string {
  const slugTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
    .slice(0, 50); // Limit length

  return `${slugTitle}-${marketId}`;
}

/**
 * Extract market ID from a slug
 * Returns null if the slug is invalid
 */
export function parseMarketSlug(slug: string): number | null {
  // The market ID is always at the end after the last hyphen
  const match = slug.match(/-(\d+)$/);
  if (match) {
    return parseInt(match[1], 10);
  }

  // Fallback: try to parse the entire slug as a number (for direct ID access)
  const directId = parseInt(slug, 10);
  if (!isNaN(directId)) {
    return directId;
  }

  return null;
}
