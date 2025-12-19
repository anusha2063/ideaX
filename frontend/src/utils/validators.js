/**
 * Data validation utilities
 */

/**
 * Validates if a coordinate is valid
 * @param {Array} coord - [longitude, latitude]
 * @returns {boolean}
 */
export const isValidCoordinate = (coord) => {
  return (
    Array.isArray(coord) &&
    coord.length === 2 &&
    typeof coord[0] === 'number' &&
    typeof coord[1] === 'number' &&
    !isNaN(coord[0]) &&
    !isNaN(coord[1]) &&
    coord[1] >= -90 &&
    coord[1] <= 90 &&
    coord[0] >= -180 &&
    coord[0] <= 180
  );
};

/**
 * Filters out invalid coordinates from an array
 * @param {Array} coordinates - Array of [lon, lat] pairs
 * @returns {Array} - Filtered valid coordinates
 */
export const filterValidCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates)) return [];
  return coordinates.filter(isValidCoordinate);
};
