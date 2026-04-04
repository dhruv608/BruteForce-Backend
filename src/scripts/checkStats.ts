import prisma from "../config/prisma";

async function checkStats() {
  try {
    const classes = await prisma.class.count();
    const questionVisibility = await prisma.questionVisibility.count();
    const batches = await prisma.batch.count();
    const topics = await prisma.topic.count();
    
    console.log("  Current Database Stats:");
    console.log(`   Batches: ${batches}`);
    console.log(`   Topics: ${topics}`);
    console.log(`   Classes: ${classes}`);
    console.log(`   Question Visibility: ${questionVisibility}`);

    // Get breakdown by batch
    const batchStats = await prisma.class.groupBy({
      by: ['batch_id'],
      _count: {
        id: true
      },
      orderBy: {
        batch_id: 'asc'
      }
    });

    console.log("\n📋 Classes per Batch:");
    for (const stat of batchStats) {
      console.log(`   Batch ${stat.batch_id}: ${stat._count.id} classes`);
    }

    // Get breakdown by topic
    const topicStats = await prisma.class.groupBy({
      by: ['topic_id'],
      _count: {
        id: true
      },
      orderBy: {
        topic_id: 'asc'
      }
    });

    console.log("\n📚 Classes per Topic:");
    for (const stat of topicStats) {
      console.log(`   Topic ${stat.topic_id}: ${stat._count.id} classes`);
    }

  } catch (error) {
    console.error("❌ Error checking stats:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStats();
