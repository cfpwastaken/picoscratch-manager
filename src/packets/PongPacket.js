import z from "zod";
import { lastPing } from "../main";
export const InPongPacket = z.object({
    type: z.literal("pong")
});
export function handlePongPacket(packet, con, ws) {
    const ping = Date.now() - lastPing;
    ws.send(JSON.stringify({
        type: "pingTime",
        ping
    }));
}
