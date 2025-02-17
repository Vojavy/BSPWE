'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface User {
	id: number;
	username: string;
	email: string;
	role: string;
}

export default function AdminUsersPage() {
	const router = useRouter();
	const [users, setUsers] = useState<User[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchUsers = useCallback(
		async (token: string) => {
			try {
				const response = await fetch('/api/admin/users', {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});

				const data = await response.json();

				if (data.status === 'success') {
					setUsers(data.users);
				} else {
					toast({
						title: 'Error',
						description: data.message,
						variant: 'destructive'
					});
					if (data.message === 'Not authorized') {
						router.push('/dashboard');
					}
				}
			} catch {
				toast({
					title: 'Error',
					description: 'Failed to fetch users',
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

		fetchUsers(token);
	}, [router, fetchUsers]);

	const handleDeleteUser = async (userId: number) => {
		if (!confirm('Are you sure you want to delete this user?')) return;

		try {
			const token = localStorage.getItem('token');
			if (!token) {
				router.push('/login');
				return;
			}

			const response = await fetch(`/api/admin/users/${userId}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			const data = await response.json();

			if (data.status === 'success') {
				toast({
					title: 'Success',
					description: 'User deleted successfully'
				});
				setUsers(users.filter((user) => user.id !== userId));
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
				description: 'Failed to delete user',
				variant: 'destructive'
			});
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<Skeleton className="h-8 w-[200px]" />
				</div>
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Username</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Role</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{[...Array(4)].map((_, i) => (
								<TableRow key={i}>
									<TableCell>
										<Skeleton className="h-4 w-[120px]" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-[200px]" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-[80px]" />
									</TableCell>
									<TableCell className="text-right">
										<Skeleton className="ml-auto h-8 w-[70px]" />
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-2">
				<h1 className="text-3xl font-bold tracking-tight">User Management</h1>
				<p className="text-sm text-muted-foreground">Manage user accounts and permissions</p>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Username</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Role</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{users.map((user) => (
							<TableRow key={user.id}>
								<TableCell className="font-medium">{user.username}</TableCell>
								<TableCell>{user.email}</TableCell>
								<TableCell>
									<Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge>
								</TableCell>
								<TableCell className="text-right">
									{user.role !== 'admin' && (
										<Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id)}>
											Delete
										</Button>
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

