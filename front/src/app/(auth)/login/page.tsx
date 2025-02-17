import { AuthForm } from '@/components/auth/auth-form';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
	title: 'Login | Web Hosting',
	description: 'Login to your web hosting account'
};

export default function LoginPage() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] px-4 sm:px-0">
				<div className="flex flex-col space-y-2 text-center">
					<h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
					<p className="text-sm text-muted-foreground">Enter your credentials to access your account</p>
				</div>
				<AuthForm mode="login" />
				<p className="text-center text-sm text-muted-foreground">
					Don&apos;t have an account?{' '}
					<Link href="/register" className="underline underline-offset-4 hover:text-primary">
						Register here
					</Link>
				</p>
			</div>
		</div>
	);
}

