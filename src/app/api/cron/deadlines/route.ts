import { NextRequest, NextResponse } from "next/server";
import { getTasksNeedingTrafficLightUpdate, updateTaskTrafficLight } from "@/db/queries";

// Validate cron secret
function validateCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error("CRON_SECRET not configured");
    return false;
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

// Calculate traffic light based on due date
function calculateTrafficLight(dueDate: string): "green" | "yellow" | "red" {
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    // Overdue
    return "red";
  } else if (diffDays <= 3) {
    // Due within 3 days
    return "yellow";
  } else {
    // More than 3 days
    return "green";
  }
}

// POST /api/cron/deadlines - Update traffic lights based on due dates
export async function POST(request: NextRequest) {
  // Validate cron secret
  if (!validateCronSecret(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const tasks = await getTasksNeedingTrafficLightUpdate();
    
    const results = {
      processed: 0,
      updated: {
        green: 0,
        yellow: 0,
        red: 0,
      },
      errors: [] as string[],
    };

    for (const task of tasks) {
      try {
        if (!task.dueDate) continue;
        
        const newTrafficLight = calculateTrafficLight(task.dueDate);
        
        // Only update if changed
        if (task.trafficLight !== newTrafficLight) {
          await updateTaskTrafficLight(task.id, newTrafficLight);
          results.updated[newTrafficLight]++;
        }
        
        results.processed++;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unbekannter Fehler";
        results.errors.push(`Fehler bei Task ${task.id}: ${message}`);
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      totalUpdated: results.updated.green + results.updated.yellow + results.updated.red,
    });
  } catch (error) {
    console.error("Deadlines update error:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren der Deadlines" },
      { status: 500 }
    );
  }
}

// GET /api/cron/deadlines - Health check
export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    status: "ok",
    endpoint: "deadlines",
    timestamp: new Date().toISOString(),
  });
}
