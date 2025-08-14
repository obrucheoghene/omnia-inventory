import { db } from "./index";
import {
  users,
  projects,
  categories,
  units,
  materials,
  materialUnits,
} from "./schema";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  try {
    console.log("🌱 Starting database seed...");

    // Create default super user
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const [superUser] = await db
      .insert(users)
      .values({
        name: "Super Admin",
        username: "admin",
        password: hashedPassword,
        role: "SUPER_USER",
      })
      .returning();

    console.log("✅ Super user created");

    // Create sample projects
    const projectsData = [
      {
        name: "Construction Project A",
        description: "Main building construction",
      },
      {
        name: "Renovation Project B",
        description: "Office renovation project",
      },
      { name: "Infrastructure Project C", description: "Road and utilities" },
    ];

    const insertedProjects = await db
      .insert(projects)
      .values(projectsData)
      .returning();
    console.log("✅ Projects created");

    // Create material categories
    const categoriesData = [
      {
        name: "Cement & Concrete",
        description: "All cement and concrete related materials",
      },
      {
        name: "Steel & Metal",
        description: "Steel bars, metal sheets, and fittings",
      },
      {
        name: "Electrical",
        description: "Wires, cables, and electrical components",
      },
      {
        name: "Plumbing",
        description: "Pipes, fittings, and plumbing materials",
      },
      {
        name: "Lumber & Wood",
        description: "Wood planks, timber, and wooden materials",
      },
      {
        name: "Paint & Finishing",
        description: "Paints, varnish, and finishing materials",
      },
    ];

    const insertedCategories = await db
      .insert(categories)
      .values(categoriesData)
      .returning();
    console.log("✅ Categories created");

    // Create units
    const unitsData = [
      { name: "Bags", abbreviation: "bags" },
      { name: "Pieces", abbreviation: "pcs" },
      { name: "Meters", abbreviation: "m" },
      { name: "Square Meters", abbreviation: "m²" },
      { name: "Cubic Meters", abbreviation: "m³" },
      { name: "Kilograms", abbreviation: "kg" },
      { name: "Tons", abbreviation: "tons" },
      { name: "Liters", abbreviation: "L" },
      { name: "Gallons", abbreviation: "gal" },
      { name: "Rolls", abbreviation: "rolls" },
    ];

    const insertedUnits = await db.insert(units).values(unitsData).returning();
    console.log("✅ Units created");

    // Create sample materials
    const materialsData = [
      {
        name: "Portland Cement",
        description: "High-quality portland cement for construction",
        categoryId: insertedCategories[0].id, // Cement & Concrete
      },
      {
        name: "Steel Rebar 12mm",
        description: "12mm diameter steel reinforcement bars",
        categoryId: insertedCategories[1].id, // Steel & Metal
      },
      {
        name: "Electrical Wire 2.5mm",
        description: "2.5mm electrical copper wire",
        categoryId: insertedCategories[2].id, // Electrical
      },
      {
        name: "PVC Pipe 4 inch",
        description: "4 inch PVC pipe for plumbing",
        categoryId: insertedCategories[3].id, // Plumbing
      },
      {
        name: "Pine Wood Planks",
        description: "Quality pine wood planks for construction",
        categoryId: insertedCategories[4].id, // Lumber & Wood
      },
    ];

    const insertedMaterials = await db
      .insert(materials)
      .values(materialsData)
      .returning();
    console.log("✅ Materials created");

    // Create material-unit relationships
    const materialUnitsData = [
      {
        materialId: insertedMaterials[0].id, // Portland Cement
        unitId: insertedUnits[0].id, // Bags
        isPrimary: true,
      },
      {
        materialId: insertedMaterials[1].id, // Steel Rebar
        unitId: insertedUnits[1].id, // Pieces
        isPrimary: true,
      },
      {
        materialId: insertedMaterials[1].id, // Steel Rebar
        unitId: insertedUnits[6].id, // Tons
        isPrimary: false,
        conversionFactor: "0.001", // 1000 pieces = 1 ton (example)
      },
      {
        materialId: insertedMaterials[2].id, // Electrical Wire
        unitId: insertedUnits[2].id, // Meters
        isPrimary: true,
      },
      {
        materialId: insertedMaterials[3].id, // PVC Pipe
        unitId: insertedUnits[1].id, // Pieces
        isPrimary: true,
      },
      {
        materialId: insertedMaterials[4].id, // Pine Wood
        unitId: insertedUnits[1].id, // Pieces
        isPrimary: true,
      },
    ];

    await db.insert(materialUnits).values(materialUnitsData);
    console.log("✅ Material-Unit relationships created");

    console.log("🎉 Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seed function if called directly
if (require.main === module) {
  seedDatabase().then(() => process.exit(0));
}
