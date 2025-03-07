'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { FileIcon, FolderIcon, Database, Mail, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { use } from 'react';

interface FileItem {
	name: string;
	type: 'file' | 'directory';
	size?: string;
	modified?: string;
}

interface DomainDetails {
	domain: string;
	db: {
		host: string;
		name: string;
		user: string;
		password: string;
	};
	ftp: {
		host: string;
		user: string;
		password: string;
		home: string;
	};
	// apache: {
	// 	config_file: string;
	// };
	// smtp: {
	// 	enabled: boolean;
	// };
}

interface PageProps {
	params: Promise<{ id: string }>;
}

export default function DomainManagePage({ params }: PageProps) {
	const { id } = use(params);
	const router = useRouter();
	const [currentPath, setCurrentPath] = useState('/');
	const [files, setFiles] = useState<FileItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [domainDetails, setDomainDetails] = useState<DomainDetails | null>(null);

	const fetchDomainDetails = useCallback(
		async (token: string) => {
			try {
				const response = await fetch(`/api/domains/${id}/details`, {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});

				const data = await response.json();
				if (data.success) {
					setDomainDetails(data.connection_details);
				}
			} catch (error) {
				toast({
					title: 'Error',
					description: 'Failed to fetch domain details',
					variant: 'destructive'
				});
			}
		},
		[id]
	);

	const fetchFiles = useCallback(
		async (token: string, path: string) => {
			try {
				const response = await fetch(`/api/domains/${id}/files?path=${encodeURIComponent(path)}`, {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});

				const data = await response.json();

				if (data.status === 'success') {
					setFiles(data.items);
				} else {
					toast({
						title: 'Error',
						description: data.message,
						variant: 'destructive'
					});
				}
			} catch {
				toast({
					title: 'Error',
					description: 'Failed to fetch files',
					variant: 'destructive'
				});
			} finally {
				setIsLoading(false);
			}
		},
		[id]
	);

	useEffect(() => {
		const token = localStorage.getItem('token');
		if (!token) {
			router.push('/login');
			return;
		}

		fetchDomainDetails(token);
		fetchFiles(token, currentPath);
	}, [router, currentPath, fetchFiles, fetchDomainDetails]);

	const handleNavigate = (item: FileItem) => {
		if (item.type === 'directory') {
			const newPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
			setCurrentPath(newPath);
		}
	};

	const handleUpload = async (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		const token = localStorage.getItem('token');
		if (!token) return;

		const files = Array.from(e.dataTransfer.files);
		const formData = new FormData();
		formData.append('path', currentPath);
		files.forEach((file) => formData.append('files', file));

		try {
			const response = await fetch(`/api/domains/${id}/files`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`
				},
				body: formData
			});

			const data = await response.json();

			if (data.status === 'success') {
				toast({
					title: 'Success',
					description: data.message
				});
				fetchFiles(token, currentPath);
			} else {
				toast({
					title: 'Error',
					description: data.message,
					variant: 'destructive'
				});
			}
		} catch {
			toast({
				title: 'Error',
				description: 'Failed to upload files',
				variant: 'destructive'
			});
		}
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
	};

	const handleGoUp = () => {
		if (currentPath === '/') return;
		const newPath = currentPath.split('/').slice(0, -1).join('/') || '/';
		setCurrentPath(newPath);
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<Skeleton className="h-8 w-[200px]" />
				</div>
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-[150px]" />
						<Skeleton className="h-4 w-[250px]" />
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
							{[...Array(8)].map((_, i) => (
								<Skeleton key={i} className="h-20 w-full" />
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-2">
				<h1 className="text-3xl font-bold tracking-tight">Domain Management</h1>
				<p className="text-sm text-muted-foreground">Manage files and services for {domainDetails?.domain}</p>
			</div>

			{domainDetails && (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader>
							<div className="flex items-center gap-2">
								<Database className="h-5 w-5 text-primary" />
								<CardTitle className="text-lg">Database</CardTitle>
							</div>
						</CardHeader>
						<CardContent className="space-y-2">
							<p className="text-sm">
								<strong>Host:</strong> {domainDetails.db.host}
							</p>
							<p className="text-sm">
								<strong>Name:</strong> {domainDetails.db.name}
							</p>
							<p className="text-sm">
								<strong>Username:</strong> {domainDetails.db.user}
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<div className="flex items-center gap-2">
								<FolderIcon className="h-5 w-5 text-primary" />
								<CardTitle className="text-lg">FTP</CardTitle>
							</div>
						</CardHeader>
						<CardContent className="space-y-2">
							<p className="text-sm">
								<strong>Host:</strong> {domainDetails.ftp.host}
							</p>
							<p className="text-sm">
								<strong>Username:</strong> {domainDetails.ftp.user}
							</p>
							<p className="text-sm">
								<strong>Home:</strong> {domainDetails.ftp.home}
							</p>
						</CardContent>
					</Card>

					{/* <Card>
						<CardHeader>
							<div className="flex items-center gap-2">
								<Server className="h-5 w-5 text-primary" />
								<CardTitle className="text-lg">Apache</CardTitle>
							</div>
						</CardHeader>
						<CardContent>
							<p className="text-sm break-all">
								<strong>Config:</strong> {domainDetails.apache.config_file}
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<div className="flex items-center gap-2">
								<Mail className="h-5 w-5 text-primary" />
								<CardTitle className="text-lg">SMTP</CardTitle>
							</div>
						</CardHeader>
						<CardContent>
							<p className="text-sm">
								<strong>Status:</strong> {domainDetails.smtp.enabled ? 'Enabled' : 'Disabled'}
							</p>
						</CardContent>
					</Card> */}
				</div>
			)}

			<Card>
				<CardHeader>
					<CardTitle>File Manager</CardTitle>
					<CardDescription className="flex items-center space-x-2">
						<span>Current path: {currentPath}</span>
						{currentPath !== '/' && (
							<Button variant="ghost" size="sm" onClick={handleGoUp} className="h-6">
								Go up
							</Button>
						)}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div
						className="rounded-lg border bg-card p-4 min-h-[300px]"
						onDrop={handleUpload}
						onDragOver={handleDragOver}
					>
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
							{files.map((item) => (
								<div
									key={item.name}
									className={cn(
										'group flex flex-col items-center justify-center rounded-lg border border-dashed p-4 transition-colors hover:border-primary',
										item.type === 'directory' && 'cursor-pointer'
									)}
									onClick={() => handleNavigate(item)}
								>
									{item.type === 'directory' ? (
										<FolderIcon className="h-8 w-8 text-blue-500" />
									) : (
										<FileIcon className="h-8 w-8 text-gray-500" />
									)}
									<p className="mt-2 text-sm font-medium">{item.name}</p>
									{item.type === 'file' && (
										<p className="text-xs text-muted-foreground">
											{item.size} • {item.modified}
										</p>
									)}
								</div>
							))}
						</div>
						{files.length === 0 && (
							<div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
								<p>No files in this directory</p>
								<p className="text-sm">Drag and drop files to upload</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
