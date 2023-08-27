import z from "zod";
import { Connection, awaitingVerification, broadcastStudentsInCourse, broadcastTeachers, broadcastVerifications, sendVerifications } from "../../connection";
import Course from "../../model/course";
import { courseLeaderboardJSON } from "../../utils";
import { WebSocket } from "ws";
import { loggedIn } from "../../main";

export const InDismissPacket = z.object({
	type: z.literal("dismiss"),
	uuid: z.string(),
	course: z.string()
})

export type InDismissPacket = z.infer<typeof InDismissPacket>;

export async function handleDismissPacket(packet: InDismissPacket, con: Connection, ws: WebSocket) {
	const verification = awaitingVerification[packet.course].find(v => v.uuid == packet.uuid);
	if(!verification) return;
	const logged = loggedIn.find(l => l.clientType == "student" && l.uuid == packet.uuid);
	if(logged) {
		logged.ws.send(JSON.stringify({type: "dismiss"}));
	}
	awaitingVerification[packet.course] = awaitingVerification[packet.course].filter(v => v.uuid != packet.uuid);
	broadcastVerifications(con.school, packet.course);
}