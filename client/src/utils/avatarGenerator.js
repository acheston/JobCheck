/**
 * Generate an SVG avatar with person's initials
 * @param {string} name - Person's full name
 * @param {number} size - Avatar size in pixels (default: 64)
 * @returns {string} SVG data URL
 */
export function generateAvatar(name, size = 64) {
  const initials = getInitials(name);
  const colors = getColorForName(name);
  
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${colors.background}"/>
      <text
        x="50%"
        y="50%"
        font-family="Arial, sans-serif"
        font-size="${size * 0.4}"
        font-weight="600"
        fill="${colors.text}"
        text-anchor="middle"
        dominant-baseline="central"
      >${initials}</text>
    </svg>
  `.trim();
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Extract initials from a person's name
 * @param {string} name - Full name (e.g., "John Doe" -> "JD")
 * @returns {string} Initials (1-2 characters)
 */
function getInitials(name) {
  if (!name) return '?';
  
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    // Single name: return first letter
    return parts[0].charAt(0).toUpperCase();
  }
  
  // Multiple names: return first letter of first and last name
  const first = parts[0].charAt(0).toUpperCase();
  const last = parts[parts.length - 1].charAt(0).toUpperCase();
  
  return first + last;
}

/**
 * Generate consistent colors for a name (deterministic based on name)
 * @param {string} name - Person's name
 * @returns {Object} Object with background and text color
 */
function getColorForName(name) {
  // Use a simple hash function to generate consistent colors
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate a hue between 0-360
  const hue = Math.abs(hash % 360);
  
  // Use pastel colors with good contrast
  const saturation = 45 + (Math.abs(hash) % 20); // 45-65%
  const lightness = 55 + (Math.abs(hash) % 15);  // 55-70%
  
  const background = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const text = '#ffffff'; // White text for good contrast
  
  return { background, text };
}
