import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = '1234567890';

const domainDetails = new Map([
	[
		'1',
		{
			domain: 'example.com',
			db: {
				username: 'example_db',
				password: 'db_pass_123',
				name: 'example_db',
				host: 'localhost'
			},
			ftp: {
				username: 'example_ftp',
				password: 'ftp_pass_123',
				home: '/var/www/example.com'
			},
			apache: {
				config_file: '/etc/apache2/sites-available/example.com.conf'
			},
			smtp: {
				enabled: true
			}
		}
	],
	[
		'2',
		{
			domain: 'test.com',
			db: {
				username: 'test_db',
				password: 'db_pass_456',
				name: 'test_db',
				host: 'localhost'
			},
			ftp: {
				username: 'test_ftp',
				password: 'ftp_pass_456',
				home: '/var/www/test.com'
			},
			apache: {
				config_file: '/etc/apache2/sites-available/test.com.conf'
			},
			smtp: {
				enabled: false
			}
		}
	],
	[
		'3',
		{
			domain: 'mysite.com',
			db: {
				username: 'mysite_db',
				password: 'db_pass_789',
				name: 'mysite_db',
				host: 'localhost'
			},
			ftp: {
				username: 'mysite_ftp',
				password: 'ftp_pass_789',
				home: '/var/www/mysite.com'
			},
			apache: {
				config_file: '/etc/apache2/sites-available/mysite.com.conf'
			},
			smtp: {
				enabled: true
			}
		}
	]
]);

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return NextResponse.json({ error: 'No token provided' }, { status: 401 });
		}

		const token = authHeader.split(' ')[1];
		const decoded = verify(token, JWT_SECRET) as { id: number };

		const { id } = await params;
		const details = domainDetails.get(id);
		if (!details) {
			return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
		}

		return NextResponse.json({
			success: true,
			connection_details: details
		});
	} catch (error) {
		return NextResponse.json({ error: 'Failed to fetch domain details' }, { status: 500 });
	}
}
