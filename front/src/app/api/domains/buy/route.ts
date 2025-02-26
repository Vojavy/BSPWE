import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = '1234567890';

const domains = new Set(['example.com', 'test.com', 'mysite.com']);
const userDomains = new Map([
	[1, new Set(['example.com', 'test.com'])],
	[2, new Set(['mysite.com'])]
]);
let lastDomainId = 3;

function generateRandomString(length: number): string {
	return Math.random()
		.toString(36)
		.substring(2, 2 + length);
}

export async function POST(request: Request) {
	try {
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return NextResponse.json({ status: 'error', message: 'No token provided' }, { status: 401 });
		}

		const token = authHeader.split(' ')[1];
		const decoded = verify(token, JWT_SECRET) as { id: number };

		const data = await request.json();

		if (!data.domain_name || !data.buyer_email) {
			return NextResponse.json({ error: 'Missing required fields: domain_name and buyer_email' }, { status: 400 });
		}

		// Validate domain name format
		if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(data.domain_name)) {
			return NextResponse.json({ error: 'Invalid domain name format' }, { status: 400 });
		}

		if (Math.random() > 0.8) {
			return NextResponse.json({ error: 'Domain already registered' }, { status: 409 });
		}

		// Generate credentials (similar to PHP logic)
		const domainPrefix = data.domain_name.replace(/[.-]/g, '').substring(0, 8);
		const randomSuffix = generateRandomString(8);

		domains.add(data.domain_name);
		lastDomainId++;

		// Add domain to user's domains
		const userDomainSet = userDomains.get(decoded.id) || new Set();
		userDomainSet.add(data.domain_name);
		userDomains.set(decoded.id, userDomainSet);

		return NextResponse.json({
			success: true,
			message: 'Domain purchased and hosting environment created successfully.',
			connection_details: {
				domain: data.domain_name,
				db: {
					username: `${domainPrefix}_db`,
					password: randomSuffix,
					name: `${domainPrefix}_db`,
					host: 'localhost'
				},
				ftp: {
					username: `${domainPrefix}_ftp`,
					password: randomSuffix,
					home: `/var/www/${data.domain_name}`
				},
				apache: {
					config_file: `/etc/apache2/sites-available/${data.domain_name}.conf`
				},
				smtp: {
					enabled: false
				}
			}
		});
	} catch (error) {
		return NextResponse.json({ error: 'Failed to process domain purchase' }, { status: 500 });
	}
}


