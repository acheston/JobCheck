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

  // Generate avatar and include it as the first option
  const avatarUrl = generateAvatar(name, 400); // Generate larger size for image picker
  const avatarCandidate = {
    url: avatarUrl,
    thumbnailUrl: avatarUrl,
    source: 'Generated Avatar',
    width: 400,
    height: 400
  };
  
  // Get profile image candidates from image search results
  if (imageData && imageData.images && imageData.images.length > 0) {
    const serperCandidates = imageData.images.slice(0, 11).map(img => ({
      url: img.imageUrl,
      thumbnailUrl: img.thumbnailUrl,
      source: img.domain,
      width: img.imageWidth,
      height: img.imageHeight
    }));
    
    // Put avatar first, then Serper images
    result.imageCandidates = [avatarCandidate, ...serperCandidates];
    
    // Find the first image that looks like a profile photo
    const validImage = imageData.images.find(img => isValidProfileImage(img));
    if (validImage) {
      result.imageUrl = validImage.imageUrl;
    } else {
      // If no valid image found, use avatar as default
      result.imageUrl = avatarUrl;
    }
  } else {
    // No images from Serper, use avatar
    result.imageCandidates = [avatarCandidate];
    result.imageUrl = avatarUrl;
  }

  // Check for people also ask or related info
  if (textData.peopleAlsoAsk && textData.peopleAlsoAsk.length > 0) {
    result.relatedQuestions = textData.peopleAlsoAsk.slice(0, 3).map(q => q.question);
  }

  return result;
}


/**
 * Generate an SVG avatar with person's initials (backend version)
 * @param {string} name - Person's full name
 * @param {number} size - Avatar size in pixels
 * @returns {string} SVG data URL
 */
function generateAvatar(name, size = 400) {
  const initials = getInitialsFromName(name);
  const colors = getColorForName(name);
  
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" fill="${colors.background}"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="600" fill="${colors.text}" text-anchor="middle" dominant-baseline="central">${initials}</text></svg>`;
  
  // Use Buffer for base64 encoding in Node.js (instead of btoa)
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Extract initials from a person's name
 * @param {string} name - Full name
 * @returns {string} Initials (1-2 characters)
 */
function getInitialsFromName(name) {
  if (!name) return '?';
  
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  const first = parts[0].charAt(0).toUpperCase();
  const last = parts[parts.length - 1].charAt(0).toUpperCase();
  
  return first + last;
}

/**
 * Generate consistent colors for a name (deterministic)
 * @param {string} name - Person's name
 * @returns {Object} Object with background and text color
 */
function getColorForName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash % 360);
  const saturation = 45 + (Math.abs(hash) % 20);
  const lightness = 55 + (Math.abs(hash) % 15);
  
  const background = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const text = '#ffffff';
  
  return { background, text };
}

/**
 * Validate if an image is likely a profile photo (not a document/screenshot)
 * @param {Object} img - Image object from Serper API
 * @returns {boolean} True if image appears to be a profile photo
 */
function isValidProfileImage(img) {
  const sourceUrl = (img.link || img.domain || '').toLowerCase();
  const imageUrl = (img.imageUrl || '').toLowerCase();
  
  // Skip if URL suggests it's a document or webpage
  const documentIndicators = [
    'pdf', 'document', 'screenshot', 'page', 'article',
    'newsletter', 'alert', 'coverage', 'insurance', 'trade'
  ];
  
  const fullUrl = (sourceUrl + ' ' + imageUrl).toLowerCase();
  for (const indicator of documentIndicators) {
    if (fullUrl.includes(indicator)) {
      return false;
    }
  }
  
  // Prefer images from professional sources
  const professionalSources = [
    'linkedin.com', 'crunchbase.com', 'twitter.com', 'github.com',
    'theorg.com', 'zoominfo.com', 'rocketreach.co', 'bloomberg.com'
  ];
  
  const isFromProfessionalSource = professionalSources.some(source => 
    sourceUrl.includes(source)
  );
  
  // Check image dimensions - profile photos are usually square-ish
  const width = img.imageWidth || 0;
  const height = img.imageHeight || 0;
  if (width === 0 || height === 0) return false;
  
  const aspectRatio = width / height;
  const isSquareish = aspectRatio >= 0.7 && aspectRatio <= 1.4;
  
  // Valid if: from professional source OR (square-ish and reasonable size)
  const hasGoodSize = width >= 150 && width <= 2000 && height >= 150 && height <= 2000;
  
  return isFromProfessionalSource || (isSquareish && hasGoodSize);
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
