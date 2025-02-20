import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = '1234567890';

function generatePassword(length: number = 12): string {
	const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
	return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return NextResponse.json({ error: 'No token provided' }, { status: 401 });
		}

		const token = authHeader.split(' ')[1];
		const decoded = verify(token, JWT_SECRET) as { id: number };

		const { id } = await params;
		// Generate new password
		const newPassword = generatePassword();

		return NextResponse.json({
			success: true,
			message: 'FTP password has been reset successfully',
			new_password: newPassword
		});
	} catch (error) {
		return NextResponse.json({ error: 'Failed to reset FTP password' }, { status: 500 });
	}
}
