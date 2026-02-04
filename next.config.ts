import type {NextConfig} from "next";
import './src/check-env'

const nextConfig: NextConfig = {
    turbopack: {
        rules: {
            '*.svg': {
                as: '*.js',
                loaders: ['@svgr/webpack'],
            },
        },
    },
    typescript: {
        ignoreBuildErrors: true,
    },
};

export default nextConfig;
