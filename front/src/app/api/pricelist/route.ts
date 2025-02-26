import { NextResponse } from 'next/server';

export async function GET() {
	return NextResponse.json({
		services: [
			{
				service: 'Domain Purchase',
				price: '$9.99/month',
				features: ['Domain Registration', 'DNS Management', 'Domain Privacy']
			},
			{
				service: 'FTP Service',
				price: '$4.99/month',
				features: ['Unlimited FTP Users', 'Secure FTP Access', '10GB Storage']
			},
			{
				service: 'Database Service',
				price: '$7.99/month',
				features: ['PostgreSQL Database', 'Daily Backups', 'phpPgAdmin Access']
			},
			{
				service: 'SMTP Service',
				price: '$5.99/month',
				features: ['Outgoing Mail Server', 'SMTP Authentication', '1000 Emails/day']
			}
		]
	});
}
