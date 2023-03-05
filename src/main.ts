import "@total-typescript/ts-reset";
import { Sequelize } from "sequelize-typescript";
import express from "express";
import { createServer } from "http";
import bodyParser from "body-parser";
import { WebSocketServer } from "ws";

import School from "./model/school.js";
import Teacher from "./model/teacher.js";
import Course from "./model/course.js";
import Student from "./model/student.js";
import Room from "./model/room.js";
import Support from "./model/support.js";
import { readFile } from "fs/promises";
import { Connection } from "./connection.js";
import { Tasks } from "./types/Task.js";
const __dirname = new URL(".", import.meta.url).pathname;

export const sql = new Sequelize(process.env.MYSQL_DB || "picoscratch", process.env.MYSQL_USER || "picoscratch", process.env.MYSQL_PASSWORD, {
	host: process.env.MYSQL_HOST || "localhost",
	dialect: "mariadb",
	models: [School, Teacher, Course, Student, Room, Support]
})

const rawTasks = JSON.parse(await readFile("tasks.json", "utf8"));

Tasks.parse(rawTasks); // If this fails, the app will error out, as there is no reason to continue if the tasks are invalid

export const tasks = rawTasks as Tasks;
let errored: boolean = false;

process.on("uncaughtException", (err) => {
	console.error(err);
	errored = true;
	console.log("ERRORED");
})

async function loadModels() {
	console.log("Syncing models...");
	if(process.argv.includes("sync")) await sql.sync({ alter: true })
}

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: process.env.SUBPATH || "/" });

app.use((req, res, next) => {
	if(req.url == "/favicon.ico") return res.sendFile("web/favicon.ico", { root: __dirname });
	next();
});

if(process.argv.includes("maintenance")) {
	app.use((req, res, next) => {
		return res.status(503).sendFile("web/maintenance.html", { root: __dirname });
	})
}

app.use((req, res, next) => {
	if(errored) return res.status(500).sendFile("web/error.html", { root: __dirname });
	next();
})

app.use(express.static("src/web"));
app.use(bodyParser.json());

await loadModels();

function randomCode() {
	const chars = "ABCDEFGHJKLMNPRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
	return Array(7).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join("");
}

app.get("/api/schoolcode/:code", async (req, res) => {
	const s = await School.findOne({ where: { code: req.params.code } });
	console.log(s);
	if(!s) return res.status(404).send({error: "School not found"});
	res.send({name: s.name, uuid: s.uuid, lang: s.lang});
})

app.post("/api/support", async (req, res) => {
	if(!req.body.data) return res.status(400).send({error: "Missing data"});
	const support = await Support.create({ data: JSON.stringify(req.body.data), code: randomCode() });
	res.send({id: support.id});
})

function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

app.post("/api/makeDemoSchool", async (req, res) => {
	if(!req.body.schoolname || !req.body.password || !req.body.lang) return res.status(400).send({error: "Missing data"});
	const randomcode = randomCode();
	const code = "demo" + randomcode.substring(4);
	await sleep(5000);
	await School.create({ name: req.body.schoolname, adminPassword: req.body.password, lang: req.body.lang, code });
	res.send({ code });
})

app.get("*", (req, res) => {
	res.sendFile("web/404.html", { root: __dirname });
})

export const loggedIn: Connection[] = [];

export let lastPing: number;
setInterval(() => {
	for(const c of loggedIn) {
		if(c.ws.readyState == 1) c.ws.send(JSON.stringify({type: "ping"}));
	}
	lastPing = Date.now();
}, 10000);

wss.addListener("connection", (ws) => {
	loggedIn.push(new Connection(ws));
})

server.listen(8080, () => {
	console.log("Server listening on port 8080");
})