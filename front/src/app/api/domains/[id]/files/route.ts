import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = '1234567890';

const fileSystem = new Map([
	[
		'/',
		[
			{ name: 'public_html', type: 'directory' },
			{ name: 'logs', type: 'directory' },
			{ name: '.htaccess', type: 'file', size: '1.2 KB', modified: '2024-02-20 12:00' }
		]
	],
	[
		'/public_html',
		[
			{ name: 'index.php', type: 'file', size: '4.5 KB', modified: '2024-02-20 12:00' },
			{ name: 'assets', type: 'directory' },
			{ name: 'css', type: 'directory' },
			{ name: 'js', type: 'directory' }
		]
	],
	[
		'/logs',
		[
			{ name: 'access.log', type: 'file', size: '256 KB', modified: '2024-02-20 12:00' },
			{ name: 'error.log', type: 'file', size: '128 KB', modified: '2024-02-20 12:00' }
		]
	],
	[
		'/public_html/assets',
		[
			{ name: 'logo.png', type: 'file', size: '24 KB', modified: '2024-02-20 12:00' },
			{ name: 'favicon.ico', type: 'file', size: '4 KB', modified: '2024-02-20 12:00' }
		]
	],
	['/public_html/css', [{ name: 'style.css', type: 'file', size: '8 KB', modified: '2024-02-20 12:00' }]],
	['/public_html/js', [{ name: 'main.js', type: 'file', size: '16 KB', modified: '2024-02-20 12:00' }]]
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
		const url = new URL(request.url);
		const path = url.searchParams.get('path') || '/';

		const files = fileSystem.get(path);
		if (!files) {
			return NextResponse.json({ error: 'Directory not found' }, { status: 404 });
		}

		return NextResponse.json({
			status: 'success',
			items: files
		});
	} catch (error) {
		return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
	}
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
		return NextResponse.json({
			status: 'success',
			message: 'Files uploaded successfully'
		});
	} catch (error) {
		return NextResponse.json({ error: 'Failed to upload files' }, { status: 500 });
	}
}
