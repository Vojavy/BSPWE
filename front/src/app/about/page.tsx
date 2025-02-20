import { Suspense } from 'react';
import { Building2, Mail, Phone, Clock, Shield, Zap, Heart, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getApiUrl } from '@/config/api';

interface CompanyData {
	company: {
		name: string;
		mission: string;
		history: string;
		values: string[];
		contact: {
			email: string;
			phone: string;
			hours: string;
		};
	};
}

async function getAboutData(): Promise<CompanyData> {
	const baseUrl = await getApiUrl();
	const res = await fetch(`${baseUrl}/api/about`, {
		headers: {
			Accept: 'application/json'
		},
		cache: 'no-store'
	});

	if (!res.ok) throw new Error('Failed to fetch about data');
	return res.json();
}

export default async function AboutPage() {
	const data = await getAboutData();
	const { company } = data;

	const valueIcons = {
		Reliability: <Zap className="h-8 w-8" />,
		Security: <Shield className="h-8 w-8" />,
		'Customer Satisfaction': <Heart className="h-8 w-8" />,
		Innovation: <Lightbulb className="h-8 w-8" />
	};

	return (
		<div className="container mx-auto py-8 space-y-8">
			<div className="text-center space-y-4 max-w-3xl mx-auto">
				<h1 className="text-4xl font-bold tracking-tight">{company.name}</h1>
				<p className="text-xl text-muted-foreground">{company.mission}</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-12">
				{company.values.map((value) => (
					<Card key={value} className="text-center">
						<CardHeader>
							<div className="mx-auto text-primary">{valueIcons[value as keyof typeof valueIcons]}</div>
							<CardTitle className="mt-4">{value}</CardTitle>
						</CardHeader>
					</Card>
				))}
			</div>

			<Card className="mt-12">
				<CardHeader>
					<CardTitle>Our History</CardTitle>
					<CardDescription>{company.history}</CardDescription>
				</CardHeader>
			</Card>

			<div className="grid gap-6 md:grid-cols-3 mt-12">
				<Card>
					<CardHeader>
						<div className="mx-auto text-primary">
							<Mail className="h-6 w-6" />
						</div>
						<CardTitle className="text-center">Email</CardTitle>
					</CardHeader>
					<CardContent className="text-center">
						<a href={`mailto:${company.contact.email}`} className="text-primary hover:underline">
							{company.contact.email}
						</a>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div className="mx-auto text-primary">
							<Phone className="h-6 w-6" />
						</div>
						<CardTitle className="text-center">Phone</CardTitle>
					</CardHeader>
					<CardContent className="text-center">
						<a href={`tel:${company.contact.phone}`} className="text-primary hover:underline">
							{company.contact.phone}
						</a>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div className="mx-auto text-primary">
							<Clock className="h-6 w-6" />
						</div>
						<CardTitle className="text-center">Support Hours</CardTitle>
					</CardHeader>
					<CardContent className="text-center">
						<p>{company.contact.hours}</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
