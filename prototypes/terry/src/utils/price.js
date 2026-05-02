/**
 * Backend support: rank store options by basket total when building one clear price-first recommendation.
 * @param {Array<{ totalPrice: number }>} storeOptions
 * @returns {Array<{ totalPrice: number }>}
 */
export function sortStoreOptionsByPrice(storeOptions) {
  return [...storeOptions].sort((a, b) => a.totalPrice - b.totalPrice);
}

/**
 * Backend support: combine shelf total with a distance penalty (geocoding / miles) for a single best trip pick.
 * @param {number} totalPrice
 * @param {number} distanceMiles
 * @param {number} [dollarsPerMile=0.35]
 */
export function adjustedTripCost(totalPrice, distanceMiles, dollarsPerMile = 0.35) {
  return totalPrice + distanceMiles * dollarsPerMile;
}
