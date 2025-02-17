import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = 'your-secret-key';

interface FileItem {
	type: 'file';
	size: string;
	modified: string;
}

interface DirectoryItem {
	type: 'directory';
	items: Record<string, FileItem | DirectoryItem>;
}

type FileSystemItem = FileItem | DirectoryItem;

const fileSystem = new Map<string, { '/': DirectoryItem }>([
	[
		'3',
		{
			'/': {
				type: 'directory',
				items: {
					public_html: {
						type: 'directory',
						items: {
							'index.html': {
								type: 'file',
								size: '2.5 KB',
								modified: '2024-02-17 14:30'
							},
							'style.css': {
								type: 'file',
								size: '1.2 KB',
								modified: '2024-02-17 14:30'
							},
							images: {
								type: 'directory',
								items: {
									'logo.png': {
										type: 'file',
										size: '50 KB',
										modified: '2024-02-17 14:30'
									}
								}
							}
						}
					},
					logs: {
						type: 'directory',
						items: {
							'access.log': {
								type: 'file',
								size: '156 KB',
								modified: '2024-02-17 14:30'
							}
						}
					}
				}
			}
		}
	]
]);

function isDirectory(item: FileSystemItem): item is DirectoryItem {
	return item.type === 'directory';
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return NextResponse.json({ status: 'error', message: 'No token provided' }, { status: 401 });
		}

		const token = authHeader.split(' ')[1];
		verify(token, JWT_SECRET);

		const { searchParams } = new URL(request.url);
		const path = searchParams.get('path') || '/';

		const { id } = await params;
		const domainFiles = fileSystem.get(id);
		if (!domainFiles) {
			return NextResponse.json({ status: 'error', message: 'Domain not found' }, { status: 404 });
		}

		let current: FileSystemItem = domainFiles['/'];
		const parts = path.split('/').filter(Boolean);
		for (const part of parts) {
			if (!isDirectory(current) || !(part in current.items)) {
				return NextResponse.json({ status: 'error', message: 'Path not found' }, { status: 404 });
			}
			current = current.items[part];
		}

		if (!isDirectory(current)) {
			return NextResponse.json({ status: 'error', message: 'Not a directory' }, { status: 400 });
		}

		return NextResponse.json({
			status: 'success',
			path,
			items: Object.entries(current.items).map(([name, item]) => ({
				name,
				...item
			}))
		});
	} catch (error) {
		console.error('File system error:', error);
		return NextResponse.json({ status: 'error', message: 'Not authorized' }, { status: 401 });
	}
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return NextResponse.json({ status: 'error', message: 'No token provided' }, { status: 401 });
		}

		const token = authHeader.split(' ')[1];
		verify(token, JWT_SECRET);

		const formData = await request.formData();
		const path = formData.get('path') as string;
		const files = formData.getAll('files');

		const { id } = await params;
		const domainFiles = fileSystem.get(id);
		if (!domainFiles) {
			return NextResponse.json({ status: 'error', message: 'Domain not found' }, { status: 404 });
		}

		return NextResponse.json({
			status: 'success',
			message: `${files.length} files uploaded successfully to ${path}`
		});
	} catch (error) {
		console.error('File upload error:', error);
		return NextResponse.json({ status: 'error', message: 'Not authorized' }, { status: 401 });
	}
}
