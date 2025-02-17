import { NextResponse } from 'next/server';

const users = new Map();

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { username, email, password } = body;

		// Basic validation
		if (!username || !email || !password) {
			return NextResponse.json({ status: 'error', message: 'All fields are required' }, { status: 400 });
		}

		// Check if user exists
		if (users.has(username)) {
			return NextResponse.json({ status: 'error', message: 'Username already exists' }, { status: 400 });
		}

		const userId = Math.floor(Math.random() * 1000) + 1;
		users.set(username, {
			id: userId,
			username,
			email,
			password,
			role: 'user'
		});

		return NextResponse.json({
			status: 'success',
			userId,
			message: 'User registered successfully'
		});
	} catch (error) {
		console.error('Registration error:', error);
		return NextResponse.json({ status: 'error', message: 'Internal server error' }, { status: 500 });
	}
}

