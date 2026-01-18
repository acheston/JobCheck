/**
 * Serper API integration for Vercel serverless functions
 */

const SERPER_SEARCH_URL = 'https://google.serper.dev/search';
const SERPER_IMAGES_URL = 'https://google.serper.dev/images';

export async function searchPerson(name, company) {
  const apiKey = process.env.SERPER_API_KEY;
  
  if (!apiKey) {
    throw new Error('SERPER_API_KEY is not configured');
  }

  const query = `"${name}" "${company}"`;
  
  try {
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
    
    return parseSearchResults(textData, imageData, name, company);
  } catch (error) {
    console.error('Serper search error:', error);
    throw error;
  }
}

function parseSearchResults(textData, imageData, name, company) {
  const result = {
    name: name,
    company: company,
    role: null,
    imageUrl: null,
    source: null,
    rawResults: [],
    imageCandidates: []
  };

  if (textData.knowledgeGraph) {
    const kg = textData.knowledgeGraph;
    if (kg.title) result.name = kg.title;
    if (kg.description) result.role = kg.description;
    if (kg.imageUrl) result.imageUrl = kg.imageUrl;
    result.source = 'knowledgeGraph';
  }

  if (textData.organic && textData.organic.length > 0) {
    result.rawResults = textData.organic.slice(0, 5).map(item => ({
      title: item.title,
      snippet: item.snippet,
      link: item.link
    }));

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
    if (validImage && !result.imageUrl) {
      result.imageUrl = validImage.imageUrl;
    } else if (!result.imageUrl) {
      // If no valid image found, use avatar as default
      result.imageUrl = avatarUrl;
    }
  } else {
    // No images from Serper, use avatar
    result.imageCandidates = [avatarCandidate];
    if (!result.imageUrl) {
      result.imageUrl = avatarUrl;
    }
  }

  return result;
}

function extractRoleFromResults(organic, name) {
  const linkedInResult = organic.find(item => 
    item.link && item.link.includes('linkedin.com')
  );

  if (linkedInResult && linkedInResult.title) {
    const role = parseLinkedInTitle(linkedInResult.title, name);
    if (role) return role;
  }

  for (const item of organic) {
    if (item.title) {
      const role = parseLinkedInTitle(item.title, name);
      if (role) return role;
    }
  }

  return null;
}

function parseLinkedInTitle(title, name) {
  if (!title) return null;

  let cleaned = title
    .replace(/\s*[\|\-–]\s*LinkedIn\s*$/i, '')
    .replace(/\s*LinkedIn\s*$/i, '')
    .trim();

  const dashMatch = cleaned.match(/^.+?\s*[\-–]\s*(.+?)(?:\s+at\s+.+)?$/i);
  
  if (dashMatch && dashMatch[1]) {
    let role = dashMatch[1].trim();
    role = role.replace(/\s+at\s+.+$/i, '').trim();
    
    if (role.length > 2 && role.length < 100) {
      const nameLower = name.toLowerCase();
      const roleLower = role.toLowerCase();
      if (!roleLower.includes(nameLower) && !nameLower.includes(roleLower)) {
        return role;
      }
    }
  }

  return null;
}

/**
 * Generate an SVG avatar with person's initials (backend version)
 * @param {string} name - Person's full name
 * @param {number} size - Avatar size in pixels
 * @returns {string} SVG data URL
 */
function generateAvatar(name, size = 400) {
  const initials = getInitialsFromName(name);
  const colors = getColorForNameBackend(name);
  
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
function getColorForNameBackend(name) {
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

export async function downloadImage(imageUrl, name) {
  // In serverless, we can't store files locally
  // Return the original URL instead
  return imageUrl;
}
