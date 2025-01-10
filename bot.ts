import { spawn } from "node:child_process";
import { accessSync } from "node:fs";
import { Readable } from "node:stream";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
	throw new Error("Missing TELEGRAM_BOT_TOKEN");
}

try {
	accessSync("yt-dlp");
} catch {
	throw new Error("Please run `npm run download` first");
}

const bot = new Telegraf(token);

bot.start((ctx) => ctx.reply("hi. send me a link."));

bot.on(message("text"), (ctx) => {
	const fromName = ctx.from.username || ctx.from.first_name || ctx.from.id;
	console.log(`> ${fromName}: ${ctx.message.text}`);

	if (!/https?:\/\//i.test(ctx.message.text)) {
		ctx.reply("Not sure what you want me to do!");
		return;
	}

	const ytdlp = spawn("./yt-dlp", ["-o", "-", ctx.message.text]);

	const readableStream = new Readable({
		read() {}, // No implementation needed, data is pushed from the child process
	});

	ytdlp.stdout.on("data", (data) => readableStream.push(data));
	ytdlp.stderr.on("data", (data) => ctx.reply(`yt-dlp stderr: ${data}`));

	ytdlp.on("close", (code) => {
		if (code !== 0) {
			ctx.reply(`yt-dlp process exited with code: ${code}`);
		}
		readableStream.push(null);
	});

	ctx.replyWithVideo({ source: readableStream });
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
