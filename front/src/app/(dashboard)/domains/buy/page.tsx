'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export default function BuyDomainPage() {
	const router = useRouter();
	const [domain, setDomain] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const token = localStorage.getItem('token');
			if (!token) {
				router.push('/login');
				return;
			}

			const response = await fetch('/api/domains/buy', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ domain })
			});

			const data = await response.json();

			if (data.status === 'success') {
				toast({
					title: 'Success',
					description: 'Domain purchased successfully'
				});
				router.push('/dashboard');
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
				description: 'Failed to purchase domain',
				variant: 'destructive'
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-2">
				<h1 className="text-3xl font-bold tracking-tight">Purchase Domain</h1>
				<p className="text-sm text-muted-foreground">Enter the domain name you want to purchase</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Domain Details</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Input
								placeholder="example.com"
								value={domain}
								onChange={(e) => setDomain(e.target.value)}
								required
								pattern="^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$"
								title="Please enter a valid domain name"
								className="font-medium"
							/>
							<p className="text-[0.8rem] text-muted-foreground">
								The domain name should follow the format: example.com
							</p>
						</div>
						<Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
							{isLoading ? 'Processing...' : 'Purchase Domain'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
