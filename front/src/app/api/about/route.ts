import { NextResponse } from 'next/server';

export async function GET() {
	return NextResponse.json({
		company: {
			name: 'MyCompany Hosting',
			mission: 'To deliver reliable and secure hosting solutions for businesses and individuals.',
			history: 'Founded in 2025 with a vision to simplify web hosting and make it accessible to everyone.',
			values: ['Reliability', 'Security', 'Customer Satisfaction', 'Innovation'],
			contact: {
				email: 'support@mycompanyhosting.com',
				phone: '+1 (555) 123-4567',
				hours: '24/7 Support'
			}
		}
	});
}
