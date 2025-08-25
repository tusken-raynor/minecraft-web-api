import { query, type MySQLDeleteResult, type MySQLInsertResult, type MySQLSchedulesRecord, type MySQLSelectResult } from "$lib/db";
import { json } from "@sveltejs/kit";
import commands from "./commands.js";
import { nextRun } from "$lib/cron/index.js";

export async function GET() {
  try {
    const rslt = await query<MySQLSelectResult<MySQLSchedulesRecord>>("SELECT * FROM schedules");
    return json({ success: true, data: rslt });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return json({ success: false, message: "Failed to fetch schedules" }, { status: 500 });
  }
}

export async function POST({ request }) {
  try {
    const body = await request.json();
    const command = body?.command || '';
    if (!command || !(command in commands)) {
      return json({ success: false, message: "Invalid command" }, { status: 400 });
    }
    const cron = body?.cron || '';
    if (!cron) {
      return json({ success: false, message: "Missing cron expression" }, { status: 400 });
    }
    const author = body?.author || '';
    if (!author) {
      return json({ success: false, message: "Invalid author" }, { status: 400 });
    }
    const description = body?.description || '';
    if (!description) {
      return json({ success: false, message: "Missing description" }, { status: 400 });
    }

    const nextRunTime = nextRun(cron);

    const payload = commands[command](body);
    if (!payload.success) {
      return json(payload, { status: 400 });
    }
    const rslt = await query<MySQLInsertResult>(
      "INSERT INTO schedules (run_at, cron, command, author, name, description) VALUES (?, ?, ?, ?, ?, ?)", 
      [nextRunTime, cron, payload.command, author, command, description]
    );
    // using the insertId, grab the newly created record
    const [newSchedule] = await query<MySQLSelectResult<MySQLSchedulesRecord>>("SELECT * FROM schedules WHERE id = ?", [rslt.insertId]);
    return json({ success: true, data: newSchedule });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return json({ success: false, message: "Failed to create schedule: " + (error as Error).message }, { status: 500 });
  }
}

export async function DELETE({ request }) {
  try {
    const body = await request.json();
    const id = body?.id;
    if (!id) {
      return json({ success: false, message: "Missing schedule ID" }, { status: 400 });
    }

    const rslt = await query<MySQLDeleteResult>("DELETE FROM schedules WHERE id = ?", [id]);
    if (rslt.affectedRows === 0) {
      return json({ success: false, message: "Schedule not found" }, { status: 404 });
    }

    return json({ success: true, message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return json({ success: false, message: "Failed to delete schedule: " + (error as Error).message }, { status: 500 });
  }
}