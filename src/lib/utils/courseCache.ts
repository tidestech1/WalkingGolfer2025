import { GolfCourse } from '@/types/course';

class LRUCache<T> {
  private cache: Map<string, T>;
  private maxSize: number;

  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (item) {
      // Refresh item position
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  set(key: string, value: T): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest item
      const firstKey = this.cache.keys().next().value;
      // Ensure firstKey is defined before deleting
      if (typeof firstKey === 'string') {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

// Cache instances
const courseCache = new LRUCache<GolfCourse>(200); // Cache up to 200 individual courses
const courseListCache = new LRUCache<{
  courses: GolfCourse[];
  timestamp: number;
  queryKey: string;
}>(20); // Cache up to 20 different course lists/search results

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export function getCachedCourse(courseId: string): GolfCourse | undefined {
  return courseCache.get(courseId);
}

export function setCachedCourse(course: GolfCourse): void {
  courseCache.set(course.id, course);
}

export function getCachedCourseList(queryKey: string): GolfCourse[] | undefined {
  const cached = courseListCache.get(queryKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.courses;
  }
  return undefined;
}

export function setCachedCourseList(queryKey: string, courses: GolfCourse[]): void {
  courseListCache.set(queryKey, {
    courses,
    timestamp: Date.now(),
    queryKey
  });
}

export function generateQueryKey(params: Record<string, unknown>): string {
  return Object.entries(params)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}:${JSON.stringify(value)}`)
    .join('|');
}

export function clearCaches(): void {
  courseCache.clear();
  courseListCache.clear();
} 