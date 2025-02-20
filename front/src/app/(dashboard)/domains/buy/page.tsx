'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { CheckCircle2, Database, FolderOpen, Server, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface PriceList {
	services: {
		service: string;
		price: string;
		features: string[];
	}[];
}

interface ConnectionDetails {
	domain: string;
	db: {
		username: string;
		password: string;
		name: string;
		host: string;
	};
	ftp: {
		username: string;
		password: string;
		home: string;
	};
	apache: {
		config_file: string;
	};
	smtp: {
		enabled: boolean;
	};
}

export default function BuyDomainPage() {
	const router = useRouter();
	const [domain, setDomain] = useState('');
	const [email, setEmail] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [priceList, setPriceList] = useState<PriceList | null>(null);
	const [baseUrl, setBaseUrl] = useState<string>('');
	const [connectionDetails, setConnectionDetails] = useState<ConnectionDetails | null>(null);
	const [showDetails, setShowDetails] = useState(false);

	useEffect(() => {
		fetch(`/api/pricelist`)
			.then((res) => res.json())
			.then((data) => setPriceList(data))
			.catch(() => {
				toast({
					title: 'Error',
					description: 'Failed to load pricing information',
					variant: 'destructive'
				});
			});
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const token = localStorage.getItem('token');
			if (!token) {
				router.push('/login');
				return;
			}

			const response = await fetch(`${baseUrl}/api/domains/buy`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					domain_name: domain,
					buyer_email: email
				})
			});

			const data = await response.json();

			if (data.success) {
				setConnectionDetails(data.connection_details);
				setShowDetails(true);
				toast({
					title: 'Success',
					description: data.message
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
				description: 'Failed to purchase domain',
				variant: 'destructive'
			});
		} finally {
			setIsLoading(false);
		}
	};

	const totalPrice = priceList?.services.reduce((acc, service) => {
		const price = parseFloat(service.price.replace('$', ''));
		return acc + price;
	}, 0);

	return (
		<>
			<div className="space-y-8 max-w-5xl mx-auto">
				<div className="flex flex-col gap-2">
					<h1 className="text-3xl font-bold tracking-tight">Purchase Domain</h1>
					<p className="text-sm text-muted-foreground">
						Get your domain with all services included for ${totalPrice?.toFixed(2)}/month
					</p>
				</div>

				<div className="grid gap-6 md:grid-cols-2">
					<Card className="md:col-span-2">
						<CardHeader>
							<CardTitle>Domain Details</CardTitle>
							<CardDescription>Enter your domain and contact information</CardDescription>
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
								<div className="space-y-2">
									<Input
										type="email"
										placeholder="your@email.com"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
										className="font-medium"
									/>
									<p className="text-[0.8rem] text-muted-foreground">
										Your email address for account creation and notifications
									</p>
								</div>
								<Button type="submit" className="w-full" disabled={isLoading}>
									{isLoading ? 'Processing...' : 'Purchase Domain with All Services'}
								</Button>
							</form>
						</CardContent>
					</Card>

					{priceList?.services.map((service, index) => (
						<Card key={index} className="bg-gradient-to-br from-primary/5 to-primary/10">
							<CardHeader>
								<CardTitle>{service.service}</CardTitle>
								<CardDescription className="text-lg font-semibold text-primary">{service.price}</CardDescription>
							</CardHeader>
							<CardContent>
								<ul className="space-y-2">
									{service.features.map((feature, i) => (
										<li key={i} className="flex items-center gap-2 text-sm">
											<CheckCircle2 className="h-4 w-4 text-primary" />
											{feature}
										</li>
									))}
								</ul>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			<Dialog open={showDetails} onOpenChange={setShowDetails}>
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Connection Details</DialogTitle>
						<DialogDescription>
							Save these details securely. You&apos;ll need them to manage your services.
						</DialogDescription>
					</DialogHeader>

					{connectionDetails && (
						<div className="space-y-6">
							<Card>
								<CardHeader>
									<div className="flex items-center gap-2">
										<Database className="h-5 w-5 text-primary" />
										<CardTitle className="text-lg">Database Details</CardTitle>
									</div>
								</CardHeader>
								<CardContent className="space-y-2">
									<p>
										<strong>Host:</strong> {connectionDetails.db.host}
									</p>
									<p>
										<strong>Database:</strong> {connectionDetails.db.name}
									</p>
									<p>
										<strong>Username:</strong> {connectionDetails.db.username}
									</p>
									<p>
										<strong>Password:</strong> {connectionDetails.db.password}
									</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<div className="flex items-center gap-2">
										<FolderOpen className="h-5 w-5 text-primary" />
										<CardTitle className="text-lg">FTP Details</CardTitle>
									</div>
								</CardHeader>
								<CardContent className="space-y-2">
									<p>
										<strong>Username:</strong> {connectionDetails.ftp.username}
									</p>
									<p>
										<strong>Password:</strong> {connectionDetails.ftp.password}
									</p>
									<p>
										<strong>Home Directory:</strong> {connectionDetails.ftp.home}
									</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<div className="flex items-center gap-2">
										<Server className="h-5 w-5 text-primary" />
										<CardTitle className="text-lg">Apache Configuration</CardTitle>
									</div>
								</CardHeader>
								<CardContent>
									<p>
										<strong>Config File:</strong> {connectionDetails.apache.config_file}
									</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<div className="flex items-center gap-2">
										<Mail className="h-5 w-5 text-primary" />
										<CardTitle className="text-lg">SMTP Status</CardTitle>
									</div>
								</CardHeader>
								<CardContent>
									<p>
										<strong>Enabled:</strong> {connectionDetails.smtp.enabled ? 'Yes' : 'No'}
									</p>
								</CardContent>
							</Card>

							<Button
								className="w-full"
								onClick={() => {
									setShowDetails(false);
									router.push('/dashboard');
								}}
							>
								Go to Dashboard
							</Button>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}

