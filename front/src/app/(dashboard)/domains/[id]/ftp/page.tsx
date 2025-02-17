'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface FTPSettings {
	host: string;
	username: string;
	password: string;
}

export default function FTPSettingsPage() {
	const [settings] = useState<FTPSettings>({
		host: 'ftp.example.com',
		username: 'user123',
		password: '********'
	});

	return (
		<div className="container py-10">
			<div className="max-w-md mx-auto">
				<Card>
					<CardHeader>
						<CardTitle>FTP Settings</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="host">FTP Host</Label>
							<Input id="host" value={settings.host} readOnly />
						</div>
						<div className="space-y-2">
							<Label htmlFor="username">Username</Label>
							<Input id="username" value={settings.username} readOnly />
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input id="password" type="password" value={settings.password} readOnly />
						</div>
						<Button
							className="w-full"
							variant="outline"
							onClick={() => {
								toast({
									title: 'Coming Soon',
									description: 'FTP functionality will be implemented soon'
								});
							}}
						>
							Reset FTP Password
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
