import type {NextConfig} from "next";

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
