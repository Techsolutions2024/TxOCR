// esbuild.config.js
const esbuild = require('esbuild');
const fs = require('node:fs');
const path = require('node:path');

const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

esbuild.build({
  entryPoints: ['./index.tsx'],
  bundle: true,
  outdir: 'dist',
  define: {
    // API_KEY sẽ được lấy từ biến môi trường do Vercel cung cấp trong quá trình build
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ""),
  },
  platform: 'browser',
  format: 'esm', // Output dưới dạng ES Modules
  sourcemap: true, // Tạo sourcemap để debug dễ dàng hơn
  minify: true, // Minify code cho production
  jsx: 'automatic', // Sử dụng JSX transform mới của React
  loader: {
    '.ts': 'ts',
    '.tsx': 'tsx',
  },
  // Đánh dấu các thư viện này là external để trình duyệt tải từ CDN thông qua importmap trong index.html
  external: ['react', 'react-dom', 'react/', 'react-dom/', '@google/genai'],
}).catch((e) => {
    console.error("Lỗi trong quá trình build với esbuild:", e);
    process.exit(1);
});

console.log('Build thành công với esbuild!');
