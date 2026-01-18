import { useState } from 'react';
import { generateAvatar } from '../utils/avatarGenerator';

/**
 * Avatar component that displays an image with fallback to initials
 * Automatically falls back if image fails to load or is invalid
 */
function Avatar({ name, imageUrl, size = 64, className = '' }) {
  const [imageError, setImageError] = useState(false);
  const avatarUrl = generateAvatar(name, size);

  const handleImageError = () => {
    setImageError(true);
  };

  // If no image URL or image failed to load, show avatar
  const useAvatar = !imageUrl || imageError;

  return (
    <div className={`avatar-container ${className}`} style={{ width: size, height: size, position: 'relative' }}>
      {useAvatar ? (
        <img
          src={avatarUrl}
          alt={name}
          style={{
            width: size,
            height: size,
            borderRadius: '50%'
          }}
        />
      ) : (
        <img
          src={imageUrl}
          alt={name}
          onError={handleImageError}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
      )}
    </div>
  );
}

export default Avatar;
