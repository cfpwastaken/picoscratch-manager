import z from "zod";
import { Connection, resendLeaderboard } from "../../connection";
import { WebSocket } from "ws";
import Student from "../../model/student";
import { capitalizeWords, courseLeaderboardJSON, studentSections } from "../../utils";
import { demoTasks, tasks } from "../../main";

export const InLoginPacket = z.object({
	type: z.literal("login"),
	name: z.string()
});

export type InLoginPacket = z.infer<typeof InLoginPacket>;

export async function handleLoginPacket(packet: InLoginPacket, con: Connection, ws: WebSocket) {
	if(!con.room) {
		ws.send(JSON.stringify({
			type: "login",
			success: false,
			error: "You have not joined a room yet"
		}));
		return;
	}
	con.room.reload();
	const course = await con.room.$get("course");
	if(!course) {
		ws.send(JSON.stringify({
			type: "login",
			success: false,
			error: "Teacher has not set a course yet"
		}));
		return;
	}
	const s = await course.$get("students");
	let stud = s.find(s => s.name == capitalizeWords(packet.name.split(" ")).join(" ")) || null;
	if(!stud) {
		if(course.allowRegister) {
			stud = await course.$create("student", {name: capitalizeWords(packet.name.split(" ")).join(" ")}) as Student;
		} else {
			ws.send(JSON.stringify({
				type: "login",
				success: false,
				error: "Teacher has not allowed registration"
			}));
			return;
		}
	}
	const student = stud as Student;
	console.log("Student", student.name, "logged in", JSON.stringify(student.toJSON(), null, 2));
	con.name = student.name;
	con.uuid = student.uuid;
	con.idle = false;
	ws.send(JSON.stringify({
		type: "login",
		success: true,
		student
	}));

	ws.send(JSON.stringify({
		type: "sections",
		...studentSections(student, con.school.isDemo ? demoTasks : tasks)
	}));

	ws.send(JSON.stringify({
		type: "leaderboard",
		leaderboard: await courseLeaderboardJSON(course)
	}));

	await resendLeaderboard(con.school, course);
}