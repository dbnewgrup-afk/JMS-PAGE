import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const prisma = new PrismaClient();

async function main() {
  const items = [
    { name: "Gitar",     price: 250_000 },
    { name: "Vocal",     price: 250_000 },
    { name: "Drum",      price: 250_000 },
    { name: "Piano",     price: 250_000 },
    { name: "Biola",     price: 250_000 },
    { name: "Bass",      price: 250_000 },
    { name: "Keyboard",  price: 250_000 },
    { name: "Flute",     price: 250_000 },
    { name: "Saxophone", price: 300_000 },
  ] as const;

  for (const it of items) {
    await prisma.lessonProduct.upsert({
      where: { name: it.name }, // asumsi name UNIQUE
      create: {
        id: crypto.randomUUID(), // penuhi kolom id yang wajib
        name: it.name,
        price: it.price,
      },
      update: { price: it.price },
    });
  }

  console.log("✅ Seeded LessonProduct (9 kelas).");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
