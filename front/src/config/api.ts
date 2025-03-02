const API_URLS = [
	'https://hosting.mojefirma.cz',
	'http://hosting.mojefirma.cz',
	'http://localhost:4444',
	'http://localhost:80',
	'http://localhost:3000'
] as const;

export async function getWorkingApiUrl(): Promise<string> {
	for (const baseUrl of API_URLS) {
		try {
			const response = await fetch(`${baseUrl}/api/about`);
			if (response.ok) {
				return baseUrl;
			}
		} catch {
			continue;
		}
	}
	return API_URLS[0]; // Default to first URL if none work
}

let cachedApiUrl: string | null = null;

export async function getApiUrl(): Promise<string> {
	if (!cachedApiUrl) {
		cachedApiUrl = await getWorkingApiUrl();
	}
	return cachedApiUrl;
}
