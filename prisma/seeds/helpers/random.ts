/**
 * Deterministic pseudo-random helper functions for StudyFlow seeding.
 */

export function pick<T>(array: T[], index: number): T {
  return array[index % array.length];
}

export function randomDateWithinLastDays(days: number, offsetIndex: number): Date {
  const now = new Date();
  // Use offsetIndex to produce consistent, well-distributed dates in the past
  const dayOffset = (offsetIndex * 7) % days;
  const hoursOffset = (offsetIndex * 13) % 24;
  return new Date(now.getTime() - (dayOffset * 24 + hoursOffset) * 3600 * 1000);
}

export function getProgressPercentage(index: number): number {
  const values = [0.0, 25.0, 50.0, 75.0, 100.0, 90.0, 15.0, 80.0];
  return values[index % values.length];
}

export const ARABIC_REVIEW_COMMENTS = [
  "المحتوى التعليمي فوق الممتاز والشرح عملي جدًا يؤهلك لسوق العمل بثقة.",
  "دبلومة استثنائية! التطبيق العملي وبناء المشاريع من الصفر أفادني جدًا في اجتياز المقابلات التقنية.",
  "تنظيم رائع في التسلسل الهرمي للمحاضرات والمينتور متجاوب دائمًا مع كافة الاستفسارات.",
  "أكواد نظيفة وأساليب هندسية حديثة تطابق تماماً ممارسات الشركات الكبرى (Production Best Practices).",
  "من أفضل المنصات التعليمية عربياً، جودة الصوت والفيديو والأكواد التفاعلية ممتازة جدًا.",
  "رحلة تعلم فارغة من الحشو وتركز مباشرة على الجوهر التقني وحل المسائل الهندسية.",
  "الشهد الحقيقي أنني تمكنت فور انتهاء الدبلومة من تنفيذ مشروع SaaS متكامل بمفردي.",
  "شرح وافٍ وتطبيقات مكثفة على معالجة الأخطاء والأمان (Authentication & Performance Optimization)."
];

export function getReviewComment(index: number): { comment: string; rating: number } {
  const comment = ARABIC_REVIEW_COMMENTS[index % ARABIC_REVIEW_COMMENTS.length];
  // Strict quality: mostly 5 stars, occasionally 4 stars
  const rating = (index % 5 === 0) ? 4 : 5;
  return { comment, rating };
}
