import { readFile } from "fs/promises"

export const loadVersion = async (): Promise<string | undefined> => {
	try {
		const packageJson = JSON.parse(await readFile('./package.json', 'utf8'))
		return packageJson.version
	} catch (e) {
		console.warn(`Failed to load version from package.json`, e?.toString())
	}  
}