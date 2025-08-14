import { db } from "@/lib/db";

export default async function TextDb() {
  try {
    await db.execute("SELECT 1");
    return <div>Database connection successul!</div>;
  } catch (error) {
    return <div>Database Connection fialed: {String(error)}</div>;
  }
}
