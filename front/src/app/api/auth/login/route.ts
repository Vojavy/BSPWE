import { NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';

const users = new Map([
	[
		'admin',
		{
			id: 1,
			username: 'admin',
			email: 'admin@example.com',
			password: 'admin123',
			role: 'admin'
		}
	],
	[
		'user',
		{
			id: 2,
			username: 'user',
			email: 'user@example.com',
			password: 'user123',
			role: 'user'
		}
	]
]);

const JWT_SECRET = '1234567890';

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { username, password } = body;

		// Basic validation
		if (!username || !password) {
			return NextResponse.json({ status: 'error', message: 'All fields are required' }, { status: 400 });
		}

		// Check if user exists and password matches
		const user = users.get(username);
		if (!user || user.password !== password) {
			return NextResponse.json({ status: 'error', message: 'Invalid credentials' }, { status: 401 });
		}

		// Generate JWT token
		const token = sign(
			{
				id: user.id,
				username: user.username,
				role: user.role
			},
			JWT_SECRET,
			{ expiresIn: '1h' }
		);

		// Remove password from user object
		const { password: _password, ...userWithoutPassword } = user;

		return NextResponse.json({
			status: 'success',
			token,
			user: userWithoutPassword
		});
	} catch (error) {
		console.error('Login error:', error);
		return NextResponse.json({ status: 'error', message: 'Internal server error' }, { status: 500 });
	}
}


