import Link from 'next/link';

export function Footer() {
	return (
		<footer className="border-t mt-auto">
			<div className="container mx-auto py-4">
				<div className="flex justify-between items-center">
					<p className="text-sm text-muted-foreground">
						© {new Date().getFullYear()} MyCompany Hosting. All rights reserved.
					</p>
					<nav>
						<Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
							About Us
						</Link>
					</nav>
				</div>
			</div>
		</footer>
	);
}
