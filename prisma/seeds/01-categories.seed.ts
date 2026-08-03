import { PrismaClient } from "@prisma/client";
import { CategoryIcon } from "./helpers/constants";

export async function seedCategories(prisma: PrismaClient): Promise<Record<string, string>> {
  console.log("\n📁 [Stage 1] Seeding StudyFlow Categories...");

  const categories = [
    { name: "Web Development", icon: CategoryIcon.Code },
    { name: "Programming Fundamentals", icon: CategoryIcon.Terminal },
    { name: "Data Science & AI", icon: CategoryIcon.Cpu },
    { name: "Business Intelligence", icon: CategoryIcon.BarChart },
    { name: "Design & UI/UX", icon: CategoryIcon.Palette },
    { name: "Mobile Development", icon: CategoryIcon.Smartphone },
    { name: "Cloud & DevOps", icon: CategoryIcon.Cloud },
    { name: "Cyber Security & Networks", icon: CategoryIcon.Shield },
    { name: "Enterprise Architecture & Microservices", icon: CategoryIcon.Server },
    { name: "Database Engineering & SQL", icon: CategoryIcon.Database },
  ];

  const categoryMap: Record<string, string> = {};

  for (const cat of categories) {
    let existing = await prisma.category.findFirst({
      where: { name: cat.name },
    });

    if (existing) {
      existing = await prisma.category.update({
        where: { id: existing.id },
        data: { icon: cat.icon },
      });
    } else {
      existing = await prisma.category.create({
        data: cat,
      });
    }

    categoryMap[cat.name] = existing.id;
  }

  console.log(`✅ Verified ${Object.keys(categoryMap).length} StudyFlow Categories.`);
  return categoryMap;
}
