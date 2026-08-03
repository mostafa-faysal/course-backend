import { PrismaClient, NotificationType, NotificationPriority } from "@prisma/client";
import { SEED_VOLUMES } from "./helpers/constants";
import { pick, randomDateWithinLastDays } from "./helpers/random";

export async function seedNotifications(prisma: PrismaClient, studentIds: string[]): Promise<void> {
  console.log(`\n🔔 [Stage 15] Batched Seeding of ~${SEED_VOLUMES.NOTIFICATIONS_COUNT} StudyFlow System Notifications...`);

  const existingCount = await prisma.notification.count();
  if (existingCount >= SEED_VOLUMES.NOTIFICATIONS_COUNT) {
    console.log(`✅ Verified ${existingCount} Existing Notifications in database.`);
    return;
  }

  const needed = SEED_VOLUMES.NOTIFICATIONS_COUNT - existingCount;
  const templates = [
    { title: "أهلاً بك في StudyFlow!", message: "سعداء بانضمامك لمجتمعنا التعليمي. ابدأ باستكشاف مساراتك التدريبية اليوم.", type: NotificationType.SYSTEM, priority: NotificationPriority.HIGH },
    { title: "تم تأكيد تسجيلك في الدبلومة بنجاح 🎉", message: "يمكنك الآن مشاهدة المحاضرات العملية والتواصل مباشرة عبر مجتمع الدعم والمينتورس.", type: NotificationType.ENROLLMENT, priority: NotificationPriority.MEDIUM },
    { title: "صدرت شهادة التخرج الخاصة بك 🏆", message: "تستطيع الآن استعراض وتنزيل شهادة التخرج الرسمية ومشاركتها عبر LinkedIn.", type: NotificationType.CERTIFICATE, priority: NotificationPriority.HIGH },
    { title: "تحديث جديد في محتوى الدبلومة 🚀", message: "تمت إضافة مشاريع عملية وتحديثات برمجية جديدة لعام 2026 داخل دبلومتك المفعلة.", type: NotificationType.COURSE, priority: NotificationPriority.MEDIUM },
  ];

  const payload = [];
  for (let i = 0; i < needed; i++) {
    const tmpl = templates[i % templates.length];
    payload.push({
      user_id: pick(studentIds, i),
      title: tmpl.title,
      message: tmpl.message,
      type: tmpl.type,
      priority: tmpl.priority,
      action_url: "/dashboard/courses",
      is_read: i % 3 === 0,
      created_at: randomDateWithinLastDays(15, i),
    });
  }

  if (payload.length > 0) {
    await prisma.notification.createMany({
      data: payload,
    });
  }

  const count = await prisma.notification.count();
  console.log(`✅ Verified ${count} System and Course Notifications for students.`);
}
