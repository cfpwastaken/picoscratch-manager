import z from "zod";
import { demoTasks } from "../../main.js";
import { tasks } from "../../check.js";
export const InGetTasksPacket = z.object({
    type: z.literal("getTasks")
});
export async function handleGetTasksPacket(packet, con, ws) {
    const schoolTasks = con.school.isDemo ? demoTasks : tasks;
    ws.send(JSON.stringify({
        type: "getTasks",
        success: true,
        tasks: schoolTasks
    }));
}
