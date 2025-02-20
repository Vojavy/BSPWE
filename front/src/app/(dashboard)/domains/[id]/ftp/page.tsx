'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { use } from 'react';
import { useRouter } from 'next/navigation';

interface FTPSettings {
	username: string;
	password: string;
	home: string;
}

interface PageProps {
	params: Promise<{ id: string }>;
}

export default function FTPSettingsPage({ params }: PageProps) {
	const { id } = use(params);
	const [settings, setSettings] = useState<FTPSettings | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const fetchFTPSettings = async () => {
			const token = localStorage.getItem('token');
			if (!token) {
				router.push('/login');
				return;
			}

			try {
				const response = await fetch(`/api/domains/${id}/details`, {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});

				const data = await response.json();
				if (data.success) {
					setSettings(data.connection_details.ftp);
				} else {
					toast({
						title: 'Error',
						description: data.error,
						variant: 'destructive'
					});
				}
			} catch {
				toast({
					title: 'Error',
					description: 'Failed to fetch FTP settings',
					variant: 'destructive'
				});
			} finally {
				setIsLoading(false);
			}
		};

		fetchFTPSettings();
	}, [id, router]);

	const handleResetPassword = async () => {
		const token = localStorage.getItem('token');
		if (!token) return;

		try {
			const response = await fetch(`/api/domains/${id}/ftp/reset-password`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			const data = await response.json();
			if (data.success) {
				setSettings((prev) => (prev ? { ...prev, password: data.new_password } : null));
				toast({
					title: 'Success',
					description: 'FTP password has been reset'
				});
			} else {
				toast({
					title: 'Error',
					description: data.error,
					variant: 'destructive'
				});
			}
		} catch {
			toast({
				title: 'Error',
				description: 'Failed to reset FTP password',
				variant: 'destructive'
			});
		}
	};

	if (isLoading || !settings) {
		return (
			<div className="container py-10">
				<div className="max-w-md mx-auto">
					<Card>
						<CardHeader>
							<CardTitle>FTP Settings</CardTitle>
							<CardDescription>Loading...</CardDescription>
						</CardHeader>
					</Card>
				</div>
			</div>
		);
	}

	return (
		<div className="container py-10">
			<div className="max-w-md mx-auto">
				<Card>
					<CardHeader>
						<CardTitle>FTP Settings</CardTitle>
						<CardDescription>Manage your FTP connection details</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="username">Username</Label>
							<Input id="username" value={settings.username} readOnly />
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input id="password" type="password" value={settings.password} readOnly />
						</div>
						<div className="space-y-2">
							<Label htmlFor="home">Home Directory</Label>
							<Input id="home" value={settings.home} readOnly />
						</div>
						<Button className="w-full" variant="outline" onClick={handleResetPassword}>
							Reset FTP Password
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
