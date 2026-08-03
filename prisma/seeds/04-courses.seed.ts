import { PrismaClient, CourseStatus } from "@prisma/client";
import { cloudinaryAssets } from "./helpers/assets";

export interface CourseSeedResult {
  courseIdMap: Record<string, string>;
  courseIds: string[];
}

export async function seedCourses(
  prisma: PrismaClient,
  categoryMap: Record<string, string>,
  instructorMap: Record<string, string>
): Promise<CourseSeedResult> {
  console.log("\n📚 [Stage 4] Seeding StudyFlow Core Diplomas & Courses...");

  const coursesData = [
    {
      key: "node",
      title: "Back-End (Node.js & Express) Diploma",
      instructorEmail: "mohamed.hassan@studyflow.com",
      categoryName: "Web Development",
      description: "مش مجرد كورس برمجة، دي رحلة متكاملة هتبني فيها سيرفرات قوية وخوارزميات معالجة عالية الأداء باستخدام Node.js وExpress.js. هتصمم قواعد بيانات علائقية وغير علائقية SQL وNoSQL مع تطبيق معايير الأمان المتقدمة Authentication & Authorization وتوثيق الـ REST APIs وبناء أنظمة الـ ORM باستخدام Prisma والعمل على بيئة Docker ونشر التطبيقات Cloud Deployment. هتشتغل على 6 مشاريع تخرج حقيقية تحاكي سوق العمل بوجود Mentor متخصص لضمان جاهزيتك كمطور Back-End احترافي.",
      price: 8500,
      discount_price: 7200,
      level: "Beginner to Advanced",
      language: "Arabic",
      duration_weeks: 17,
      duration_hours: 120,
      projects_count: 6,
      requirements: ["Basic Computer Skills", "Programming Fundamentals", "HTML & HTTP Basics"],
      learning_outcomes: ["Node.js & Express.js", "RESTful Architecture", "Prisma ORM & PostgreSQL", "JWT & Security Protocols", "Docker Containers", "Production Deployment"],
    },
    {
      key: "fundamentals",
      title: "Programming Fundamentals & Problem Solving",
      instructorEmail: "nour.eldin@studyflow.com",
      categoryName: "Programming Fundamentals",
      description: "تُعرّفك دبلومة أساسيات البرمجة على مبادئ التفكير المنطقي والهندسي البرمجي خطوة بخطوة من الصفر. هتتعلم المفاهيم الجوهرية للبرمجة مثل المتغيرات، الشروط والمصفوفات، الحلقات التكرارية، الدوال البرمجية، وهياكل البيانات الأساسية، مع حل أكثر من 150 مسألة خوارزمية وتطبيقات حية تساعدك على اقتحام أي تخصص برمجي لاحقاً (سواء Web أو Mobile أو الذكاء الاصطناعي) بكل ثقة واحتراف.",
      price: 5500,
      discount_price: null,
      level: "Beginner",
      language: "Arabic",
      duration_weeks: 8,
      duration_hours: 60,
      projects_count: 4,
      requirements: ["No Previous Programming Experience Required", "Passion for Logic & Learning"],
      learning_outcomes: ["Algorithmic Thinking", "Data Types & Variables", "Control Flow & Loops", "Functions & Scope", "Introduction to OOP", "Problem Solving Best Practices"],
    },
    {
      key: "frontend",
      title: "Front-End Development (React.js & Tailwind CSS)",
      instructorEmail: "ahmed.ali@studyflow.com",
      categoryName: "Web Development",
      description: "اتعلم تطوير واجهات التطبيقات والمواقع الحديثة Front-End Development من الصفر وصولاً إلى أقصى درجات الاحتراف. ستبدأ من أساسيات HTML5 وCSS3 مروراً بـ JavaScript الحديثة ES6+ وحتى إتقان مكتبة React.js وإدارة الحالة باستخدام Redux Toolkit وتصميم واجهات فائقة الاستجابة باستخدام Tailwind CSS. ستبني منصات تفاعلية تتصل مباشرة بالـ REST APIs بمشاريع عملية ضخمة تؤهلك للتوظيف فوراً.",
      price: 8500,
      discount_price: 7500,
      level: "Beginner to Advanced",
      language: "Arabic",
      duration_weeks: 18,
      duration_hours: 120,
      projects_count: 5,
      requirements: ["Basic Computer Operating & File Management", "No Code Knowledge Required"],
      learning_outcomes: ["Modern HTML5 & CSS3", "Modern JavaScript (ES6+)", "React.js & Redux Toolkit", "Tailwind CSS Design Systems", "API Integration & Async Code", "Git Version Control"],
    },
    {
      key: "data_analysis",
      title: "Data Analysis & Business Intelligence Bootcamp",
      instructorEmail: "omar.mahmoud@studyflow.com",
      categoryName: "Business Intelligence",
      description: "اكتشف قوة تحليل البيانات في عالم العقود والشركات الحديثة. في هذه الدبلومة الشاملة، ستتعلّم استخراج البيانات وتحويلها وتنظيفها باستخدام لغة SQL و Python بمكتبتي Pandas و Numpy، وصولاً إلى تصوير البيانات وبناء لوحات تفاعلية وصنع القرارات الاستراتيجية باستخدام أحدث تقنيات Tableau و Microsoft Power BI لمعالجة مجموعات بيانات حقيقية للنوادي والبنوك والمتاجر الإلكترونية.",
      price: 7500,
      discount_price: 6400,
      level: "Intermediate",
      language: "Arabic",
      duration_weeks: 14,
      duration_hours: 95,
      projects_count: 5,
      requirements: ["Basic Mathematics & Analytical Thinking", "Microsoft Excel Fundamentals"],
      learning_outcomes: ["SQL Data Extraction", "Python Data Manipulation (Pandas)", "Power BI Interactive Dashboards", "Tableau Visual Analytics", "Statistical Decision Making", "ETL Pipelines Basics"],
    },
    {
      key: "uiux",
      title: "UI/UX Design Masterclass (Figma & UX Architecture)",
      instructorEmail: "sara.ahmed@studyflow.com",
      categoryName: "Design & UI/UX",
      description: "المسار الأفضل والأشمل لتصبح مصمم واجهات وتجربة مستخدم UI/UX Designer محترف ومطلوب في السوق العالمي. ستتعلم منهجية التفكير التصميمي (Design Thinking)، كيفية إجراء أبحاث المستخدمين (User Research)، رسم رحلة العميل (User Journey Maps) وإعداد والنماذج المبدئية (Wireframes & Prototypes) مع إتقان أداة Figma الشاملة وبناء Design Systems كاملة من البداية حتى النهاية.",
      price: 6800,
      discount_price: null,
      level: "Beginner to Professional",
      language: "Arabic",
      duration_weeks: 12,
      duration_hours: 80,
      projects_count: 6,
      requirements: ["A Computer capable of running Figma", "An Eye for Art and Design Quality"],
      learning_outcomes: ["Design Thinking Methodologies", "User Research & Personas", "Figma Interactive Prototypes", "Design Systems & Tokenization", "Usability Testing & Feedback", "Developer Hand-off Protocols"],
    },
    {
      key: "java",
      title: "Java Back-End & Spring Boot Enterprise Architecture",
      instructorEmail: "youssef.ibrahim@studyflow.com",
      categoryName: "Web Development",
      description: "ادخل إلى قلب هندسة أنظمة الشركات الكبرى والبنوك مع دبلومة Java & Spring Boot Enterprise. ستبدأ من البرمجة الكائنية المتقدمة OOP وميكانيكا JVM وصولاً إلى تصميم وبناء واجهات البرمجة Spring Mvc, Spring Security, Hibernate/JPA، والتعامل مع قواعد بيانات ضخمة وتحليل البنى المعقدة للميكروسرفيسز (Microservices Architecture) باستخدام Spring Cloud مع تطبيق اختبارات التكامل والكتابة النظيفة للأكواد.",
      price: 9500,
      discount_price: 8200,
      level: "Intermediate to Advanced",
      language: "Arabic",
      duration_weeks: 20,
      duration_hours: 140,
      projects_count: 8,
      requirements: ["Programming Fundamentals", "Object-Oriented Programming (OOP) Knowledge"],
      learning_outcomes: ["Deep Java & JVM Fundamentals", "Spring Boot 3 Enterprise Framework", "Spring Security & OAuth2", "Hibernate ORM & JPA", "Microservices Architecture", "Unit & Integration Testing"],
    },
    {
      key: "php",
      title: "PHP Laravel Enterprise Application Development",
      instructorEmail: "mahmoud.adel@studyflow.com",
      categoryName: "Web Development",
      description: "إطار العمل الإحترافي الأسرع انتشاراً والأعلى طلباً في المنطقة العربية وأوروبا! ستبني معنا أنظمة SaaS متكاملة باستخدام Laravel و PHP 8+، ستتعلم الهندسة النظيفة للمتحكمات والمستودعات والخدمات (Clean Architecture & Service Layer)، استخدام Eloquent ORM بطرق الأداء الاحترافي دون الوقوع في استعلامات N+1، تنفيذ الجداول السحابية Jobs & Queues وبحار المصادقات والبث اللحظي عبر الـ WebSockets.",
      price: 8000,
      discount_price: null,
      level: "Intermediate",
      language: "Arabic",
      duration_weeks: 16,
      duration_hours: 110,
      projects_count: 6,
      requirements: ["PHP Basics", "Object-Oriented Programming (OOP)", "Database SQL Fundamentals"],
      learning_outcomes: ["PHP 8+ Modern Syntax", "Laravel Eloquent & Advanced ORM", "Queue Processing & WebSockets", "API Development with Laravel Sanctuary", "Clean Code & Solid Principles", "Server Performance Optimization"],
    },
    {
      key: "ai",
      title: "Artificial Intelligence & Deep Learning Engineer",
      instructorEmail: "mostafa.samir@studyflow.com",
      categoryName: "Data Science & AI",
      description: "الفرصة الذهبية لولوج تقنيات الغد وثورة الذكاء الاصطناعي والتوريد الذاتي AI & Machine Learning. ستبني نماذج الذكاء الاصطناعي التنبؤية بالاستعانة بالخوارزميات الإحصائية المتقدمة للتعلم الآلي والشبكات العصبية (Neural Networks & Deep Learning) وتطبيقات معالجة اللغات الطبيعية (NLP) والرؤية الحاسوبية (Computer Vision) بالاعتماد على إطارات العمل العملاقة TensorFlow و PyTorch لتنفيذ أنظمة حية تتخذ أدهش القرارات تلقائياً.",
      price: 12000,
      discount_price: 10500,
      level: "Advanced",
      language: "Arabic",
      duration_weeks: 24,
      duration_hours: 180,
      projects_count: 10,
      requirements: ["Linear Algebra & Probability Basics", "Python Programming Fluency", "Logical Problem Solving"],
      learning_outcomes: ["Supervised & Unsupervised Machine Learning", "Deep Neural Networks with TensorFlow & PyTorch", "Computer Vision (CNNs)", "Natural Language Processing (NLP)", "Model Evaluation & Tuning", "Deploying AI Models to Production APIs"],
    },
    {
      key: "flutter",
      title: "Flutter Mobile Application Masterclass (iOS & Android)",
      instructorEmail: "mariam.nabil@studyflow.com",
      categoryName: "Mobile Development",
      description: "صمّم وابنِ تطبيقات للهواتف الذكية تنافسية لنظامي iOS و Android بواسطة كود برمجي واحد! ستحلق في هذه الدبلومة عبر أعماق لغة Dart وإطار العمل Flutter، بدءاً من البناء الهندسي للـ Widgets المخصصة والأنيمشن الاحترافي، انتقالاً لإدارة حالة التطبيق باستخدام أحدث الممارسات (Cubit & BLoC Pattern)، مع الربط المباشر بـ Firebase و RESTful APIs لبناء تطبيقات ضخمة جاهزة للـ Play Store و App Store.",
      price: 9000,
      discount_price: 7900,
      level: "Beginner to Advanced",
      language: "Arabic",
      duration_weeks: 16,
      duration_hours: 115,
      projects_count: 7,
      requirements: ["Programming Fundamentals", "Object-Oriented Programming (OOP) Basics"],
      learning_outcomes: ["Dart Programming & Memory Lifecycle", "Flutter Beautiful Custom UIs & Animations", "State Management via BLoC / Cubit", "REST API & Firebase Cloud Services", "Local Database & SQLite Integration", "App Store & Google Play Publishing"],
    },
    {
      key: "dotnet",
      title: ".NET Core Back-End Developer Roadmap",
      instructorEmail: "khaled.fawzy@studyflow.com",
      categoryName: "Web Development",
      description: "المسار الهابط للمهندس المحترف لبناء تطبيقات خادم مؤسسية باستخدام C# و إطار .NET Core الرهيب. ستغوص في أعماق لغة C# المتقدمة، وبناء واجهات البرمجة الفورية ASP.NET Core Web APIs، وهندسة وصول البيانات باستخدام Entity Framework Core، وتصميم تطبيقات الحوسبة السحابية المتكاملة باستخدام Microsoft Azure، وتوفير أقصى سرعات الاستجابة والتحكم الأمني الهيكلي.",
      price: 9000,
      discount_price: null,
      level: "Intermediate to Advanced",
      language: "Arabic",
      duration_weeks: 18,
      duration_hours: 130,
      projects_count: 6,
      requirements: ["C# or Java Basic Syntax", "Object-Oriented Programming (OOP)", "Relational Database Basics"],
      learning_outcomes: ["Advanced C# 12 & Modern Practices", "ASP.NET Core Web APIs & Clean Architecture", "Entity Framework Core ORM & SQL Server", "Authentication with JWT & Identity", "Cloud Integration with MS Azure", "Automated DevOps Pipelines for .NET"],
    },
  ] as const;

  const courseIdMap: Record<string, string> = {};
  const courseIds: string[] = [];

  for (const item of coursesData) {
    const instructorId = instructorMap[item.instructorEmail];
    const categoryId = categoryMap[item.categoryName] || categoryMap["Web Development"];

    if (!instructorId) {
      console.warn(`⚠️ Warning: Instructor not found for ${item.title}`);
      continue;
    }

    const assets = cloudinaryAssets.courses[item.key as keyof typeof cloudinaryAssets.courses];
    const coursePayload = {
      title: item.title,
      description: item.description,
      thumbnail: assets.thumbnail,
      card_image: assets.card_image,
      cover_image: assets.cover_image,
      preview_image: assets.preview_image,
      preview_video: assets.preview_video,
      instructor_id: instructorId,
      category_id: categoryId,
      price: item.price,
      discount_price: item.discount_price,
      level: item.level,
      language: item.language,
      duration_weeks: item.duration_weeks,
      duration_hours: item.duration_hours,
      projects_count: item.projects_count,
      requirements: [...item.requirements],
      learning_outcomes: [...item.learning_outcomes],
      status: CourseStatus.PUBLISHED,
    };

    let existingCourse = await prisma.course.findFirst({
      where: { title: item.title },
    });

    if (existingCourse) {
      existingCourse = await prisma.course.update({
        where: { id: existingCourse.id },
        data: coursePayload,
      });
    } else {
      existingCourse = await prisma.course.create({
        data: coursePayload,
      });
    }

    courseIdMap[item.title] = existingCourse.id;
    courseIds.push(existingCourse.id);
  }

  console.log(`✅ Verified ${courseIds.length} StudyFlow Diplomas.`);
  return { courseIdMap, courseIds };
}
