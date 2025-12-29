/** @type {import('next').NextConfig} */

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'madcompm.b-cdn.net',
      },
    ],
  },
};

// module.exports = nextConfig;

// const nextConfig = {};

export default nextConfig;
