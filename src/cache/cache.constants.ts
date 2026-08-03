/**
 * Time To Live (TTL) in seconds for various platform sections.
 * Engineered to balance database offloading with real-time UI consistency.
 */
export const CACHE_TTL = {
  HERO: 24 * 3600,         // 24 hours
  CATEGORIES: 3600,        // 1 hour
  FEATURED_COURSES: 900,   // 15 minutes
  POPULAR_COURSES: 900,    // 15 minutes
  TOP_RATED_COURSES: 900,  // 15 minutes
  NEW_COURSES: 900,        // 15 minutes
  TOP_INSTRUCTORS: 1800,   // 30 minutes
  STATISTICS: 600,         // 10 minutes
  SEARCH_SUGGESTIONS: 300, // 5 minutes
  CONFIG: 24 * 3600,       // 24 hours (Static shell config)
  FAQ: 24 * 3600,          // 24 hours
  TESTIMONIALS: 1800,      // 30 minutes
} as const;

/**
 * Granular tags for high-precision Cache Invalidation.
 * Prevents purging entire cache stores when a single resource updates.
 */
export const CACHE_TAGS = {
  HOME_HERO: 'home-hero',
  HOME_CATEGORIES: 'home-categories',
  HOME_FEATURED: 'home-featured',
  HOME_POPULAR: 'home-popular',
  HOME_TOP_RATED: 'home-top-rated',
  HOME_NEW: 'home-new',
  HOME_INSTRUCTORS: 'home-instructors',
  HOME_STATISTICS: 'home-statistics',
  HOME_CONFIG: 'home-config',
  HOME_TESTIMONIALS: 'home-testimonials',
  HOME_FAQ: 'home-faq',
  SEARCH_SUGGESTIONS: 'search-suggestions',
} as const;
