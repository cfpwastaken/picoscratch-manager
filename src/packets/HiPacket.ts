import z from "zod";
import School from "../model/school";
import Teacher from "../model/teacher";
import Course from "../model/course";
import Room from "../model/room";
import { Connection } from "../connection";
import { authenticate } from "../utils";
import sequelize from "sequelize";
import { WebSocket } from "ws";

export const InGenericHiPacket = z.object({
	type: z.literal("hi"),
	schoolCode: z.string(),
	clientType: z.enum(["teacher", "student"]),
});

export const InTeacherHiPacket = InGenericHiPacket.extend({
	clientType: z.literal("teacher"),
	username: z.string(),
	password: z.string(),
});

export const InStudentHiPacket = InGenericHiPacket.extend({
	clientType: z.literal("student"),
});

export const InHiPacket = z.union([InTeacherHiPacket, InStudentHiPacket]);

// Types
export type InGenericHiPacket = z.infer<typeof InGenericHiPacket>;
export type InTeacherHiPacket = z.infer<typeof InTeacherHiPacket>;
export type InStudentHiPacket = z.infer<typeof InStudentHiPacket>;
export type InHiPacket = z.infer<typeof InHiPacket>;

export async function handleHiPacket(packet: InHiPacket, con: Connection, ws: WebSocket) {
	const s = await School.findOne({ where: { code: packet.schoolCode }, include: [Teacher, Course, Room] });
	if(!s) {
		ws.send(JSON.stringify({
			type: "hi",
			error: "Invalid school code",
			success: false
		}));
		return;
	}
	con.school = s;
	


	if (packet.clientType === "teacher") {
		await handleTeacherHiPacket(packet, con, ws);
	} else if(packet.clientType === "student") {
		await handleStudentHiPacket(packet, con, ws);
	} else {
		ws.send(JSON.stringify({
			type: "conversationError",
			error: "Invalid client type",
			success: false
		}));
		ws.close();
		return;
	}

	con.clientType = packet.clientType;
}

async function handleTeacherHiPacket(packet: InTeacherHiPacket, con: Connection, ws: WebSocket) {
	if(!InTeacherHiPacket.safeParse(packet).success) {
		ws.send(JSON.stringify({
			type: "conversationError",
			error: "Invalid teacher hi packet",
			success: false
		}));
		ws.close();
		return;
	}
	const auth = await authenticate(con.school.uuid, packet.username, packet.password);
	if(auth.error) {
		ws.send(JSON.stringify({
			type: "hi",
			error: auth.error,
			success: false
		}));
		return;
	}
	con.isAdmin = auth.admin;

	if(!(packet.username.toLowerCase() == "admin")) { // If the user is not admin
		// TODO: test if this even works
		const t = await Teacher.findOne({ where: {
			schoolUuid: con.school.uuid,
			username: sequelize.where(sequelize.fn("LOWER", sequelize.col("username")), "LIKE", "%" + packet.username.toLowerCase() + "%")
		}, include: [Course, Room] });
		if(!t) {
			ws.send(JSON.stringify({
				type: "hi",
				error: "Invalid username",
				success: false
			}));
			return;
		}
		con.thisTeacher = t;
	}

	ws.send(JSON.stringify({
		type: "hi",
		success: true,
		school: con.school,
		lang: con.school.lang // TODO: deprecate
	}));
}

async function handleStudentHiPacket(packet: InStudentHiPacket, con: Connection, ws: WebSocket) {
	const rooms = await con.school.$get("rooms");
	ws.send(JSON.stringify({
		type: "hi",
		success: true,
		schoolname: con.school.name, // TODO: deprecate
		rooms,
		lang: con.school.lang // TODO: deprecate
	}));
}