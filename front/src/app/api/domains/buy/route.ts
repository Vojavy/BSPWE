import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = 'your-secret-key';

const domains = new Set(['example.com', 'test.com', 'mysite.com']);
const userDomains = new Map([
	[1, new Set(['example.com', 'test.com'])],
	[2, new Set(['mysite.com'])]
]);
let lastDomainId = 3;

export async function POST(request: Request) {
	try {
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return NextResponse.json({ status: 'error', message: 'No token provided' }, { status: 401 });
		}

		const token = authHeader.split(' ')[1];
		const decoded = verify(token, JWT_SECRET) as { id: number };

		const { domain } = await request.json();

		if (!domain) {
			return NextResponse.json({ status: 'error', message: 'Domain name is required' }, { status: 400 });
		}

		// Check if domain is already taken
		if (domains.has(domain)) {
			return NextResponse.json({ status: 'error', message: 'Domain not available' }, { status: 400 });
		}

		domains.add(domain);
		lastDomainId++;

		// Add domain to user's domains
		const userDomainSet = userDomains.get(decoded.id) || new Set();
		userDomainSet.add(domain);
		userDomains.set(decoded.id, userDomainSet);

		return NextResponse.json({
			status: 'success',
			domainId: lastDomainId,
			message: 'Domain successfully purchased'
		});
	} catch {
		return NextResponse.json({ status: 'error', message: 'Not authorized' }, { status: 401 });
	}
}
