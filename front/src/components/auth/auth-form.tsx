'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface AuthFormProps {
	mode: 'login' | 'register';
}

export function AuthForm({ mode }: AuthFormProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState({
		username: '',
		password: '',
		email: ''
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
			const payload = mode === 'login' ? { username: formData.username, password: formData.password } : formData;

			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const data = await response.json();
			console.log('response:', data);
			if (data.status === 'success') {
				if (mode === 'login') {
					// Store the token
					localStorage.setItem('token', data.token);
					router.push('/dashboard');
				} else {
					toast.success('Registration successful! Please log in.');
					router.push('/login');
				}
			} else {
				toast.error(data.message);
			}
		} catch (error) {
			toast.error('An error occurred. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader>
				<CardTitle>{mode === 'login' ? 'Login' : 'Register'}</CardTitle>
				<CardDescription>
					{mode === 'login' ? 'Enter your credentials to access your account' : 'Create a new account'}
				</CardDescription>
			</CardHeader>
			<form onSubmit={handleSubmit}>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="username">Username</Label>
						<Input
							id="username"
							required
							value={formData.username}
							onChange={(e) => setFormData({ ...formData, username: e.target.value })}
						/>
					</div>
					{mode === 'register' && (
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								required
								value={formData.email}
								onChange={(e) => setFormData({ ...formData, email: e.target.value })}
							/>
						</div>
					)}
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							type="password"
							required
							value={formData.password}
							onChange={(e) => setFormData({ ...formData, password: e.target.value })}
						/>
					</div>
				</CardContent>
				<CardFooter>
					<Button className="w-full" type="submit" disabled={isLoading}>
						{isLoading ? 'Loading...' : mode === 'login' ? 'Login' : 'Register'}
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
}

