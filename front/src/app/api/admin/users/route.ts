import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = '1234567890';

const users = [
	{
		id: 1,
		username: 'admin',
		email: 'admin@example.com',
		role: 'admin'
	},
	{
		id: 2,
		username: 'user',
		email: 'user@example.com',
		role: 'user'
	},
	{
		id: 3,
		username: 'john_doe',
		email: 'john@example.com',
		role: 'user'
	},
	{
		id: 4,
		username: 'jane_doe',
		email: 'jane@example.com',
		role: 'user'
	}
];

export async function GET(request: Request) {
	try {
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return NextResponse.json({ status: 'error', message: 'No token provided' }, { status: 401 });
		}

		const token = authHeader.split(' ')[1];
		const decoded = verify(token, JWT_SECRET) as { role: string };

		if (decoded.role !== 'admin') {
			return NextResponse.json({ status: 'error', message: 'Not authorized' }, { status: 403 });
		}

		return NextResponse.json({
			status: 'success',
			users
		});
	} catch {
		return NextResponse.json({ status: 'error', message: 'Not authorized' }, { status: 401 });
	}
}
