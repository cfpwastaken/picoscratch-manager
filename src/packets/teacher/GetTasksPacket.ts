import z from "zod";
import { Connection } from "../../connection.js";
import { WebSocket } from "ws";
import { demoTasks } from "../../main.js";
import { tasks } from "../../check.js";

export const InGetTasksPacket = z.object({
	type: z.literal("getTasks")
});

export type InGetTasksPacket = z.infer<typeof InGetTasksPacket>;

export async function handleGetTasksPacket(packet: InGetTasksPacket, con: Connection, ws: WebSocket) {
	const schoolTasks = con.school.isDemo ? demoTasks : tasks;
	ws.send(JSON.stringify({
		type: "getTasks",
		success: true,
		tasks: schoolTasks
	}));
}