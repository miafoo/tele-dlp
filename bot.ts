import { spawn } from "node:child_process";
import { accessSync } from "node:fs";
import { Readable } from "node:stream";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";

try {
	accessSync("yt-dlp");
} catch {
	throw new Error("Please run `npm run download` first");
}

const allowList = process.env.TELEGRAM_BOT_ALLOW_LIST?.split(",") || [];
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
	throw new Error("Missing TELEGRAM_BOT_TOKEN");
}

const bot = new Telegraf(token);

bot.start((ctx) => ctx.reply("hi. send me a link."));

bot.on(message("text"), (ctx) => {
	const fromName =
		ctx.from.username || ctx.from.first_name || String(ctx.from.id);

	if (allowList.length > 0 && !allowList.includes(fromName)) {
		ctx.reply("Get out");
		return;
	}

	console.log(
		`[${new Date().toISOString()}] @${fromName}: ${ctx.message.text}`,
	);

	if (!/https?:\/\//i.test(ctx.message.text)) {
		ctx.reply("Not sure what you want me to do!");
		return;
	}

	ctx.reply("👀");

	const ytdlp = spawn("./yt-dlp", ["-o", "-", ctx.message.text]);

	const readableStream = new Readable({
		read() {}, // No implementation needed, data is pushed from the child process
	});

	ytdlp.stdout.on("data", (data) => readableStream.push(data));
	ytdlp.stderr.on("data", (data) => console.log(`yt-dlp stderr: ${data}`));

	ytdlp.on("close", (code) => {
		if (code !== 0) {
			ctx.reply(`yt-dlp process exited with code: ${code}`);
		}
		readableStream.push(null);
	});

	ctx
		.replyWithVideo({ source: readableStream })
		.catch((err) => ctx.reply(`Something went wrong: ${err}`));
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
