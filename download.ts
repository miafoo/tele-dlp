import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import stream from "node:stream";
import { finished } from "node:stream/promises";

const repoOwner = "yt-dlp";
const repoName = "yt-dlp";
const outputFile = "yt-dlp";

interface GithubRelease {
	assets: Array<{ browser_download_url: string; name: string }>;
}

async function getLatestRelease(): Promise<GithubRelease> {
	const url = `https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`;
	const response = await fetch(url, {
		headers: {
			Accept: "application/vnd.github.v3+json",
		},
	});
	return response.json();
}

async function downloadFile(url: string, outputPath: string) {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Error downloading file: ${response.statusText}`);
	}
	const fileStream = fs.createWriteStream(outputPath);
	return finished(
		// biome-ignore lint/suspicious/noExplicitAny: i cry
		stream.Readable.fromWeb(response.body as any).pipe(fileStream),
	);
}

function getAssetForPlatform({ assets }: GithubRelease): string | null {
	const platform = os.platform();
	if (platform === "linux") {
		return (
			assets.find((v) => v.name.includes("linux") && !v.name.includes("zip"))
				?.name || null
		);
	}
	if (platform === "darwin") {
		return (
			assets.find((v) => v.name.includes("macos") && !v.name.includes("zip"))
				?.name || null
		);
	}
	if (platform === "win32") {
		return (
			assets.find((v) => v.name.includes("windows") && !v.name.includes("zip"))
				?.name || null
		);
	}
	throw new Error("Unknown arch");
}

async function main() {
	try {
		const release = await getLatestRelease();
		const assetName = getAssetForPlatform(release);

		if (!assetName) {
			console.error("No suitable asset found for your platform.");
			return;
		}

		const asset = release.assets.find((asset) => asset.name === assetName);
		if (!asset) {
			throw new Error("Could not find any release");
		}

		const downloadUrl = asset.browser_download_url;
		console.log(`Downloading ${assetName} from ${downloadUrl}...`);

		const outputPath = path.resolve(__dirname, outputFile);
		await downloadFile(downloadUrl, outputPath);

		console.log(`Downloaded to ${outputPath}`);
	} catch (error) {
		console.error("Error downloading the latest release:", error);
	}
}

main();
