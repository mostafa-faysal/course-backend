import { STUDENT_DOMAIN } from "./constants";

export interface StudentNameProfile {
  full_name: string;
  email: string;
  country: string;
  bio: string;
}

const FIRST_NAMES = [
  "محمد", "أحمد", "عمر", "خالد", "يوسف", "محمود", "إبراهيم", "مصطفى", "حسن", "حسين",
  "علي", "ياسر", "كريم", "زياد", "سعد", "ماجد", "طارق", "سامر", "وائل", "رامي",
  "سارة", "منى", "مريم", "نور", "هدى", "ليلى", "ياسمين", "زينب", "فريدة", "شهد",
  "رنا", "سلمى", "آية", "ندى", "فاطمة", "إيمان", "سمر", "ريم", "هالة", "داليا"
];

const LAST_NAMES = [
  "الأحمدي", "السالم", "المصري", "الكردي", "الهاشمي", "العبادي", "الدوسري", "القرني",
  "فوزي", "الشريف", "القاضي", "الفقي", "الراشد", "النجار", "الهلالي", "منصور",
  "الغنيمي", "سليمان", "محمود", "عز الدين", "صلاح", "رياض", "توفيق", "السيّد", "مجدي"
];

const COUNTRIES = ["Egypt", "Saudi Arabia", "United Arab Emirates", "Jordan", "Qatar", "Kuwait", "Oman", "Bahrain"];

const BIOS = [
  "Junior Software Developer learning high-performance system architectures.",
  "Front-End Engineering enthusiast passionate about clean design & UX.",
  "Computer Science graduate bridging theoretical logic with real-world practice.",
  "Data analyst learning AI & Predictive Modeling with Python.",
  "Back-End developer building RESTful APIs & Cloud deployments.",
  "Mobile Flutter developer aiming for scalable multi-platform applications.",
  "Senior QA Automation transitioning into full-stack architecture.",
  "Software systems product designer building interactive design tokens.",
  "Cloud infrastructure engineering enthusiast.",
  "Active learner aspiring to work in top tech enterprises in the MENA region."
];

export function getUniqueStudents(count: number): StudentNameProfile[] {
  const students: StudentNameProfile[] = [];
  const usedNames = new Set<string>();

  let i = 0;
  while (students.length < count) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
    const fullName = `${first} ${last}`;
    const cleanEmail = `${first}.${last}.${i}`.replace(/\s+/g, "").toLowerCase() + STUDENT_DOMAIN;

    if (!usedNames.has(fullName)) {
      usedNames.add(fullName);
      students.push({
        full_name: fullName,
        email: cleanEmail,
        country: COUNTRIES[i % COUNTRIES.length],
        bio: BIOS[i % BIOS.length],
      });
    }
    i++;
  }
  return students;
}

export const INSTRUCTOR_PROFILES = [
  {
    full_name: "Mohamed Hassan",
    email: "mohamed.hassan@studyflow.com",
    bio: "Senior Back-End Engineer & System Architect with 10+ years of building scalable enterprise systems.",
    country: "Egypt",
  },
  {
    full_name: "Nour Eldin",
    email: "nour.eldin@studyflow.com",
    bio: "Programming Fundamentals Instructor specializing in Algorithms, Logic Design, and Problem Solving.",
    country: "Egypt",
  },
  {
    full_name: "Ahmed Ali",
    email: "ahmed.ali@studyflow.com",
    bio: "Senior Front-End Developer & React/Next.js Expert leading modern UI architecture teams.",
    country: "Egypt",
  },
  {
    full_name: "Omar Mahmoud",
    email: "omar.mahmoud@studyflow.com",
    bio: "Data Analysis & Business Intelligence Specialist helping companies turn big data into decision insights.",
    country: "United Arab Emirates",
  },
  {
    full_name: "Sara Ahmed",
    email: "sara.ahmed@studyflow.com",
    bio: "UI/UX Designer & Design Systems Lead with 8+ years designing award-winning digital experiences.",
    country: "Egypt",
  },
  {
    full_name: "Youssef Ibrahim",
    email: "youssef.ibrahim@studyflow.com",
    bio: "Java Back-End Developer & Spring Boot Enterprise Architect with deep domain in microservices.",
    country: "Saudi Arabia",
  },
  {
    full_name: "Mahmoud Adel",
    email: "mahmoud.adel@studyflow.com",
    bio: "PHP Laravel Expert & Cloud Systems Architect building high-concurrency SaaS platforms.",
    country: "Egypt",
  },
  {
    full_name: "Mostafa Samir",
    email: "mostafa.samir@studyflow.com",
    bio: "Artificial Intelligence Engineer & Deep Learning Researcher focusing on NLP and Computer Vision.",
    country: "Egypt",
  },
  {
    full_name: "Mariam Nabil",
    email: "mariam.nabil@studyflow.com",
    bio: "Flutter Mobile Application Lead Developer creating cross-platform apps with 500k+ users.",
    country: "Egypt",
  },
  {
    full_name: "Khaled Fawzy",
    email: "khaled.fawzy@studyflow.com",
    bio: ".NET Core Back-End Architect & Azure Cloud Solutions Engineer in enterprise fintech.",
    country: "Jordan",
  },
];
