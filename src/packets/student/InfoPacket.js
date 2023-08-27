import z from "zod";
import { tasks } from "../../main";
export const InInfoPacket = z.object({
    type: z.literal("info"),
    level: z.number()
});
export async function handleInfoPacket(packet, con, ws) {
    ws.send(JSON.stringify({ type: "info", name: tasks[packet.level].name, desc: tasks[packet.level].desc }));
}
