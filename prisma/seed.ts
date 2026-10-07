import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Opalite database...");

  // 1. Seed default designer / active user
  await prisma.user.upsert({
    where: { email: "lucia@orblinn.com" },
    update: {},
    create: {
      id: "usr-lucia",
      name: "Lucia",
      fullName: "Lucia Ramos",
      email: "lucia@orblinn.com",
      role: "Creative Director",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  // 2. Seed Clients
  const orblinnClient = await prisma.client.upsert({
    where: { name: "Orblinn" },
    update: {},
    create: {
      id: "client-orblinn",
      name: "Orblinn",
      contact: "Lena Voss",
      company: "Orblinn",
      email: "studio@orblinn.com",
      phone: "+31 20 1234 567",
      status: "Active",
      notes: "Lifestyle brand. Prefers a quiet, editorial direction. Weekly check-ins on Thursdays.",
      projectsCount: 1,
    },
  });

  await prisma.client.upsert({
    where: { name: "Nova" },
    update: {},
    create: {
      id: "client-nova",
      name: "Nova",
      contact: "Marcus Reid",
      company: "Nova Wellness",
      email: "hello@novawellness.co",
      phone: "+44 20 7946 0018",
      status: "Active",
      notes: "Rebrand for a wellness studio. Marcus is the decision-maker. Tight timeline.",
      projectsCount: 1,
    },
  });

  await prisma.client.upsert({
    where: { name: "Marlow & Co." },
    update: {},
    create: {
      id: "client-marlow",
      name: "Marlow & Co.",
      contact: "Priya Nair",
      company: "Marlow & Co.",
      email: "inquiries@marlowco.com",
      phone: "+1 415 555 0142",
      status: "Active",
      notes: "Packaging and visual system for luxury home goods.",
      projectsCount: 1,
    },
  });

  // 3. Seed Projects
  await prisma.project.upsert({
    where: { id: "orblinn" },
    update: {},
    create: {
      id: "orblinn",
      name: "ORBLINN",
      clientId: orblinnClient.id,
      clientName: "Orblinn",
      type: "Brand Identity",
      status: "In Progress",
      progress: 68,
      notes: "Tactile, minimal, warm editorial identity.",
      visualPreview: JSON.stringify({
        fontSpecimen: "ORBLINN",
        secondaryFont: "Satoshi & Editorial Serif",
        monogram: "O",
        palette: ["#191918", "#5A5A55", "#D6C7B0", "#F7F7F4"],
        gridAccent: "12-col / 8pt baseline",
      }),
      brandBrain: JSON.stringify({
        story: {
          overview: "ORBLINN is a minimalist design studio creating tactile identities for modern brands.",
          mission: "Elevate sensory brand experiences through restraint and craft.",
          coreIdea: "Quiet elegance, tactile materials, spatial rhythm.",
        },
        audience: {
          description: "Discerning founders and creative directors.",
          needs: "Cohesive visual voice and distinctive physical presence.",
          problems: "Generic digital sameness across contemporary branding.",
          motivations: "Timelessness, editorial credibility.",
        },
        positioning: {
          statement: "The editorial brand studio for tactile luxury.",
          differentiator: "Physical material intelligence fused with digital systems.",
          competitiveContext: "Boutique creative agencies in Europe and US.",
          opportunity: "Dominating the tactile-minimalist aesthetic space.",
        },
        personality: {
          traits: ["Restrained", "Tactile", "Editorial", "Intelligent"],
          voice: "Confident, calm, and deliberate.",
        },
        visualDirection: {
          shouldFeelLike: ["Warm brutalism", "Archival paper", "Generous whitespace"],
          shouldNotFeelLike: ["Cluttered", "Gaudy neon", "Tech-generic"],
        },
      }),
      canvasObjects: JSON.stringify([
        {
          id: "bb-orblinn",
          type: "brand_brain",
          x: 80,
          y: 60,
          width: 320,
          height: 380,
          zIndex: 1,
          content: {
            title: "ORBLINN",
            client: "Orblinn",
            type: "Brand Identity",
          },
        },
        {
          id: "font-orblinn-1",
          type: "font",
          x: 440,
          y: 60,
          width: 320,
          height: 220,
          zIndex: 2,
          content: {
            fontFamily: "Cabinet Grotesk",
            variant: "700",
            previewText: "Sphinx of black quartz, hear my vow",
            category: "sans-serif",
          },
        },
        {
          id: "palette-orblinn-1",
          type: "palette",
          x: 440,
          y: 310,
          width: 320,
          height: 180,
          zIndex: 3,
          content: {
            name: "Warm Editorial",
            colors: ["#191918", "#5A5A55", "#D6C7B0", "#F7F7F4"],
          },
        },
      ]),
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
