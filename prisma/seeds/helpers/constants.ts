export enum CategoryIcon {
  Code = "Code",
  Server = "Server",
  Database = "Database",
  Palette = "Palette",
  Smartphone = "Smartphone",
  Cpu = "Cpu",
  Cloud = "Cloud",
  Shield = "Shield",
  Terminal = "Terminal",
  BarChart = "BarChart",
}

export enum UIIcon {
  LaptopCode = "LaptopCode",
  Users = "Users",
  Award = "Award",
  CheckCircle = "CheckCircle",
  BookOpen = "BookOpen",
  Clock = "Clock",
  Star = "Star",
  TrendingUp = "TrendingUp",
  ShieldCheck = "ShieldCheck",
  Globe = "Globe",
}

export const PLATFORM_NAME = "StudyFlow";
export const SUPPORT_EMAIL = "support@studyflow.com";
export const INSTRUCTOR_DOMAIN = "@studyflow.com";
export const STUDENT_DOMAIN = "@student.studyflow.com";

export const DEFAULT_PASSWORD = "12345678";
export const FRONTEND_COURSE_TITLE = "Front-End Development (React.js & Tailwind CSS)";
export const FRONTEND_INSTRUCTOR_EMAIL = "ahmed.ali@studyflow.com";
export const FRONTEND_COHORT_STUDENTS = [
  { email: "ahmed.frontend2026@student.studyflow.com", full_name: "أحمد حسام (Front-End Student 1)" },
  { email: "sara.frontend2026@student.studyflow.com", full_name: "سارة طارق (Front-End Student 2)" },
  { email: "omar.frontend2026@student.studyflow.com", full_name: "عمر ماجد (Front-End Student 3)" },
  { email: "mariam.frontend2026@student.studyflow.com", full_name: "مريم فوزي (Front-End Student 4)" },
  { email: "youssef.frontend2026@student.studyflow.com", full_name: "يوسف إبراهيم (Front-End Student 5)" },
];

export const SEED_VOLUMES = {
  STUDENTS_COUNT: 150,
  ENROLLMENTS_COUNT: 800,
  REVIEWS_COUNT: 300,
  ORDERS_COUNT: 200,
  CERTIFICATES_COUNT: 250,
  NOTIFICATIONS_COUNT: 200,
  WISHLIST_COUNT: 150,
  CART_COUNT: 80,
};
