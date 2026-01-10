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

  if (imageData && imageData.images) {
    result.imageCandidates = getImageCandidates(imageData.images);
    if (result.imageCandidates.length > 0 && !result.imageUrl) {
      result.imageUrl = result.imageCandidates[0].url;
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

function getImageCandidates(images) {
  if (!images || images.length === 0) return [];

  const prioritySources = ['theorg.com', 'linkedin.com', 'zoominfo.com', 'rocketreach.co'];
  
  const scored = images.map(img => {
    let score = 0;
    const aspectRatio = img.imageWidth / img.imageHeight;
    
    if (aspectRatio >= 0.8 && aspectRatio <= 1.2) score += 50;
    
    for (let i = 0; i < prioritySources.length; i++) {
      if (img.domain && img.domain.includes(prioritySources[i])) {
        score += 30 - (i * 5);
        break;
      }
    }
    
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

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(({ score, ...rest }) => rest);
}

export async function downloadImage(imageUrl, name) {
  // In serverless, we can't store files locally
  // Return the original URL instead
  return imageUrl;
}
