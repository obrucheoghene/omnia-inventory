import { db } from "@/lib/db";
import { users, projects, categories } from "@/lib/db/schema";

export default async function TestDatabase() {
  try {
    // Test basic queries
    const userCount = await db.select().from(users);
    const projectCount = await db.select().from(projects);
    const categoryCount = await db.select().from(categories);

    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Database Test</h1>
        <div className="space-y-2">
          <p>✅ Database connection successful!</p>
          <p>👥 Users: {userCount.length}</p>
          <p>📋 Projects: {projectCount.length}</p>
          <p>📁 Categories: {categoryCount.length}</p>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Database Error</h1>
        <p className="text-red-500">Error: {String(error)}</p>
      </div>
    );
  }
}
