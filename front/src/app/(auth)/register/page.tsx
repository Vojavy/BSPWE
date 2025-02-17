import { AuthForm } from '@/components/auth/auth-form';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
	title: 'Register | Web Hosting',
	description: 'Create a new web hosting account'
};

export default function RegisterPage() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] px-4 sm:px-0">
				<div className="flex flex-col space-y-2 text-center">
					<h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
					<p className="text-sm text-muted-foreground">Enter your details to create your account</p>
				</div>
				<AuthForm mode="register" />
				<p className="text-center text-sm text-muted-foreground">
					Already have an account?{' '}
					<Link href="/login" className="underline underline-offset-4 hover:text-primary">
						Login here
					</Link>
				</p>
			</div>
		</div>
	);
}
