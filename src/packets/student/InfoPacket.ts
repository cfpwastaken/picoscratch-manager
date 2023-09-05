import z from "zod";
import { Connection } from "../../connection.js";
import { WebSocket } from "ws";
import { codingTasks } from "../../main.js";
import { getTasksForCourse } from "../../utils.js";

export const InInfoPacket = z.object({
	type: z.literal("info"),
	level: z.number()
});

export type InInfoPacket = z.infer<typeof InInfoPacket>;

export async function handleInfoPacket(packet: InInfoPacket, con: Connection, ws: WebSocket) {
	const course = await con.room.$get("course");
	if(course == null) return;
	const courseTasks = await getTasksForCourse(course.uuid);
	ws.send(JSON.stringify({ type: "info", name: courseTasks[packet.level].name, desc: courseTasks[packet.level].desc }));
}