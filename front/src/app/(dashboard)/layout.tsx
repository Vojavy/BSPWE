'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface DashboardLayoutProps {
	children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
	const router = useRouter();

	useEffect(() => {
		const token = localStorage.getItem('token');
		if (!token) {
			router.push('/login');
		}
	}, [router]);

	const handleLogout = () => {
		localStorage.removeItem('token');
		router.push('/login');
	};

	return (
		<div className="min-h-screen bg-background">
			<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container px-4 md:px-6 h-14 max-w-screen-2xl mx-auto">
					<nav className="flex h-full items-center justify-between">
						<div className="flex items-center gap-6 text-sm">
							<Button variant="ghost" className="font-medium" onClick={() => router.push('/dashboard')}>
								Dashboard
							</Button>
							<Button variant="ghost" className="font-medium" onClick={() => router.push('/domains/buy')}>
								Buy Domain
							</Button>
						</div>
						<Button variant="outline" onClick={handleLogout}>
							Logout
						</Button>
					</nav>
				</div>
			</header>
			<main className="container px-4 md:px-6 max-w-screen-2xl mx-auto py-6 lg:py-8">{children}</main>
		</div>
	);
}
