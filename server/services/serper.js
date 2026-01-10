import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

/**
 * Serper API integration for searching person information
 * API Documentation: https://serper.dev/
 */

const SERPER_SEARCH_URL = 'https://google.serper.dev/search';
const SERPER_IMAGES_URL = 'https://google.serper.dev/images';

/**
 * Search for a person's professional information using Serper API
 * @param {string} name - Person's name
 * @param {string} company - Person's current company
 * @returns {Promise<Object>} Search results with name, role, and image
 */
async function searchPerson(name, company) {
  const apiKey = process.env.SERPER_API_KEY;
  
  if (!apiKey) {
    throw new Error('SERPER_API_KEY is not configured');
  }

  const query = `"${name}" "${company}"`;
  
  try {
    // Run text search and image search in parallel
    const [textResponse, imageResponse] = await Promise.all([
      fetch(SERPER_SEARCH_URL, {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: query, num: 10 })
      }),
      fetch(SERPER_IMAGES_URL, {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: `${name} ${company}`, num: 15 })
      })
    ]);

    if (!textResponse.ok) {
      throw new Error(`Serper API error: ${textResponse.status}`);
    }

    const textData = await textResponse.json();
    const imageData = imageResponse.ok ? await imageResponse.json() : null;
    
    return await parseSearchResults(textData, imageData, name, company);
  } catch (error) {
    console.error('Serper search error:', error);
    throw error;
  }
}

/**
 * Parse Serper API response to extract person information
 * @param {Object} textData - Text search API response
 * @param {Object} imageData - Image search API response
 * @param {string} name - Original search name
 * @param {string} company - Original search company
 * @returns {Promise<Object>} Parsed person information
 */
async function parseSearchResults(textData, imageData, name, company) {
  const result = {
    name: name,
    company: company,
    role: null,
    imageUrl: null,
    source: null,
    rawResults: []
  };

  // Try to get info from knowledge graph first
  if (textData.knowledgeGraph) {
    const kg = textData.knowledgeGraph;
    if (kg.title) result.name = kg.title;
    if (kg.description) result.role = kg.description;
    if (kg.imageUrl) result.imageUrl = kg.imageUrl;
    result.source = 'knowledgeGraph';
  }

  // Check organic results for additional info
  if (textData.organic && textData.organic.length > 0) {
    result.rawResults = textData.organic.slice(0, 5).map(item => ({
      title: item.title,
      snippet: item.snippet,
      link: item.link
    }));

    // If no role from knowledge graph, try to extract from LinkedIn
    if (!result.role) {
      const role = extractRoleFromResults(textData.organic, name);
      if (role) {
        result.role = role;
        result.source = 'linkedin';
      }
    }
  }

  // Get profile image candidates from image search results
  if (imageData && imageData.images) {
    const imageCandidates = getImageCandidates(imageData.images);
    result.imageCandidates = imageCandidates;
    // Set the first candidate as the default
    if (imageCandidates.length > 0) {
      result.imageUrl = imageCandidates[0].url;
    }
  }

  // Check for people also ask or related info
  if (textData.peopleAlsoAsk && textData.peopleAlsoAsk.length > 0) {
    result.relatedQuestions = textData.peopleAlsoAsk.slice(0, 3).map(q => q.question);
  }

  return result;
}

/**
 * Get image candidates sorted by likelihood of being a good profile photo
 * Prioritizes square images from professional sources
 * @param {Array} images - Image search results
 * @returns {Array} Array of image candidates with url, source, and dimensions
 */
function getImageCandidates(images) {
  if (!images || images.length === 0) return [];

  // Priority sources for professional headshots
  const prioritySources = ['theorg.com', 'linkedin.com', 'zoominfo.com', 'rocketreach.co'];
  
  // Score and sort images
  const scored = images.map(img => {
    let score = 0;
    const aspectRatio = img.imageWidth / img.imageHeight;
    
    // Prefer square images (profile photos are usually square)
    if (aspectRatio >= 0.8 && aspectRatio <= 1.2) score += 50;
    
    // Prefer images from professional sources
    for (let i = 0; i < prioritySources.length; i++) {
      if (img.domain && img.domain.includes(prioritySources[i])) {
        score += 30 - (i * 5); // Higher priority sources get more points
        break;
      }
    }
    
    // Prefer larger images (but not too large)
    if (img.imageWidth >= 200 && img.imageWidth <= 1000) score += 20;
    if (img.imageWidth >= 400) score += 10;
    
    return {
      url: img.imageUrl,
      thumbnailUrl: img.thumbnailUrl,
      source: img.domain,
      width: img.imageWidth,
      height: img.imageHeight,
      score
    };
  });

  // Sort by score and return top candidates
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(({ score, ...rest }) => rest);
}

/**
 * Download an image and save it locally
 * @param {string} imageUrl - URL of the image to download
 * @param {string} name - Person's name for filename
 * @returns {Promise<string|null>} Local URL path or null on failure
 */
async function downloadImage(imageUrl, name) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') || '';
    let extension = 'jpg';
    if (contentType.includes('png')) extension = 'png';
    else if (contentType.includes('webp')) extension = 'webp';
    else if (contentType.includes('gif')) extension = 'gif';

    const filename = `${uuidv4()}.${extension}`;
    const filepath = path.join(IMAGES_DIR, filename);

    const buffer = await response.arrayBuffer();
    await fs.writeFile(filepath, Buffer.from(buffer));

    // Return the URL path that will be served by Express
    return `/images/${filename}`;
  } catch (error) {
    console.error('Error downloading image:', error);
    return null;
  }
}

/**
 * Extract role from search results, prioritizing LinkedIn
 * LinkedIn titles are typically: "Name - Title at Company" or "Name - Title"
 * @param {Array} organic - Organic search results
 * @param {string} name - Person's name to filter out from title
 * @returns {string|null} Extracted role or null
 */
function extractRoleFromResults(organic, name) {
  // First, look for LinkedIn results
  const linkedInResult = organic.find(item => 
    item.link && item.link.includes('linkedin.com')
  );

  if (linkedInResult && linkedInResult.title) {
    const role = parseLinkedInTitle(linkedInResult.title, name);
    if (role) return role;
  }

  // Try all results for LinkedIn-style title patterns
  for (const item of organic) {
    if (item.title) {
      const role = parseLinkedInTitle(item.title, name);
      if (role) return role;
    }
  }

  // Fallback: try to extract from snippets
  for (const item of organic) {
    const snippet = item.snippet || '';
    // Look for patterns like "is the CEO of" or "serves as VP of"
    const patterns = [
      /(?:is|serves as|works as|currently)\s+(?:the\s+)?([A-Z][a-zA-Z\s,]+?)(?:\s+(?:at|of|for)\s+)/i,
      /(?:^|\.\s*)([A-Z][a-zA-Z\s]+(?:Officer|President|Director|Manager|Engineer|Developer|Designer|Lead|Head))/i
    ];
    
    for (const pattern of patterns) {
      const match = snippet.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  }

  return null;
}

/**
 * Parse a LinkedIn-style title to extract the role
 * Examples: 
 *   "John Smith - Senior Engineer at Google" -> "Senior Engineer"
 *   "Jane Doe - VP of Engineering at Meta - LinkedIn" -> "VP of Engineering"
 * @param {string} title - The page title
 * @param {string} name - Person's name to remove
 * @returns {string|null} Extracted role or null
 */
function parseLinkedInTitle(title, name) {
  if (!title) return null;

  // Remove common suffixes like "| LinkedIn", "- LinkedIn"
  let cleaned = title
    .replace(/\s*[\|\-–]\s*LinkedIn\s*$/i, '')
    .replace(/\s*LinkedIn\s*$/i, '')
    .trim();

  // Pattern: "Name - Role at Company" or "Name - Role"
  // The dash/hyphen separates name from role
  const dashMatch = cleaned.match(/^.+?\s*[\-–]\s*(.+?)(?:\s+at\s+.+)?$/i);
  
  if (dashMatch && dashMatch[1]) {
    let role = dashMatch[1].trim();
    
    // Remove "at Company" suffix if present
    role = role.replace(/\s+at\s+.+$/i, '').trim();
    
    // Validate it looks like a role (not just random text)
    if (role.length > 2 && role.length < 100) {
      // Check it's not just the person's name repeated
      const nameLower = name.toLowerCase();
      const roleLower = role.toLowerCase();
      if (!roleLower.includes(nameLower) && !nameLower.includes(roleLower)) {
        return role;
      }
    }
  }

  return null;
}

export { searchPerson, downloadImage };
