import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = '1234567890';

const userDomains = new Map([
	[
		1,
		[
			{
				id: 1,
				name: 'example.com',
				status: 'active'
			},
			{
				id: 2,
				name: 'test.com',
				status: 'pending'
			}
		]
	],
	[
		2,
		[
			{
				id: 3,
				name: 'mysite.com',
				status: 'active'
			}
		]
	]
]);

const users = new Map([
	[
		1,
		{
			id: 1,
			username: 'admin',
			email: 'admin@example.com',
			role: 'admin'
		}
	],
	[
		2,
		{
			id: 2,
			username: 'user',
			email: 'user@example.com',
			role: 'user'
		}
	]
]);

export async function GET(request: Request) {
	try {
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return NextResponse.json({ status: 'error', message: 'No token provided' }, { status: 401 });
		}

		const token = authHeader.split(' ')[1];
		const decoded = verify(token, JWT_SECRET) as { id: number };
		const user = users.get(decoded.id);

		if (!user) {
			return NextResponse.json({ status: 'error', message: 'User not found' }, { status: 404 });
		}

		const domains = userDomains.get(user.id) || [];

		return NextResponse.json({
			status: 'success',
			data: {
				...user,
				domains
			}
		});
	} catch {
		return NextResponse.json({ status: 'error', message: 'Not authorized' }, { status: 401 });
	}
}
