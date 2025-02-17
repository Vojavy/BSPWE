import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
	title: 'Web Hosting Platform',
	description: 'School project web hosting platform'
};

interface RootLayoutProps {
	children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
	return (
		<html lang="en">
			<body className={inter.className}>
				{children}
				<Toaster />
			</body>
		</html>
	);
}

