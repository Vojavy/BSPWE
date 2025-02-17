import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	experimental: {
		reactCompiler: true,
		serverActions: {
			allowedOrigins: ['localhost:3000', '10.96.0.40:3000', '192.168.137.1:3000', '93.115.172.81:3000']
		}
	}
};

export default nextConfig;

