import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;




// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   async headers() {
//     return [
//       {
//         source: "/:path*",
//         headers: [
//           { key: "Access-Control-Allow-Credentials", value: "true" },
//           { key: "Access-Control-Allow-Origin", value: "*" },
//           { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
//           { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
//         ]
//       }
//     ]
//   },
//   env: {
//     FRONTEND_URL: process.env.FRONTEND_URL,
//     BACKEND_URL: process.env.BACKEND_URL
//   },
//   reactStrictMode: false,
//   devIndicators: false,
//   experimental : {
//     fetchCache : true
//   }
// }

// module.exports = nextConfig