'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Domain {
	id: number;
	name: string;
	status: string;
}

interface UserProfile {
	username: string;
	email: string;
	role: string;
	domains: Domain[];
}

export default function DashboardPage() {
	const router = useRouter();
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchProfile = useCallback(
		async (token: string) => {
			try {
				const response = await fetch('/api/user/profile', {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});

				const data = await response.json();
				console.log(data)
				if (data.status === 'success') {
					setProfile(data.data);
				} else {
					toast({
						title: 'Error',
						description: data.message,
						variant: 'destructive'
					});
					router.push('/login');
				}
			} catch {
				toast({
					title: 'Error',
					description: 'Failed to fetch profile',
					variant: 'destructive'
				});
			} finally {
				setIsLoading(false);
			}
		},
		[router]
	);

	useEffect(() => {
		const token = localStorage.getItem('token');
		if (!token) {
			router.push('/login');
			return;
		}

		fetchProfile(token);
	}, [router, fetchProfile]);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<Skeleton className="h-8 w-[150px]" />
					<Skeleton className="h-10 w-[120px]" />
				</div>
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{[...Array(3)].map((_, i) => (
						<Card key={i} className="overflow-hidden">
							<CardHeader className="pb-0">
								<Skeleton className="h-6 w-[140px]" />
							</CardHeader>
							<CardContent className="mt-4">
								<Skeleton className="h-4 w-[100px] mb-4" />
								<div className="flex gap-2">
									<Skeleton className="h-9 w-[80px]" />
									<Skeleton className="h-9 w-[100px]" />
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	const getStatusColor = (status: string) => {
		if (status !== undefined){ 
			switch (status.toLowerCase()) {
				case 'active':
					return 'text-green-600 dark:text-green-500';
				case 'pending':
					return 'text-yellow-600 dark:text-yellow-500';
				default:
					return 'text-muted-foreground';
			}
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-1">
					<h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
					<p className="text-sm text-muted-foreground">Welcome back, {profile?.username}!</p>
				</div>
				<Button size="sm" className="w-full sm:w-auto" onClick={() => router.push('/domains/buy')}>
					Buy Domain
				</Button>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{profile?.domains.map((domain) => (
					<Card key={domain.id} className="overflow-hidden">
						<CardHeader>
							<CardTitle className="line-clamp-1">{domain.name}</CardTitle>
						</CardHeader>
						<CardContent>
							<p className={`text-sm mb-4 ${getStatusColor(domain.status)}`}>Status: {domain.status}</p>
							<div className="flex flex-wrap gap-2">
								<Button variant="outline" size="sm" onClick={() => router.push(`/domains/${domain.id}`)}>
									Manage
								</Button>
								<Button variant="outline" size="sm" onClick={() => router.push(`/domains/${domain.id}/ftp`)}>
									FTP Settings
								</Button>
							</div>
						</CardContent>
					</Card>
				))}

				{profile?.domains.length === 0 && (
					<Card className="col-span-full p-6">
						<div className="flex flex-col items-center justify-center text-center">
							<p className="mb-4 text-sm text-muted-foreground">You don&apos;t have any domains yet</p>
							<Button onClick={() => router.push('/domains/buy')}>Buy Your First Domain</Button>
						</div>
					</Card>
				)}
			</div>
		</div>
	);
}

