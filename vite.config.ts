import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 9092,
    // 添加代理配置解决跨域问题
    proxy: {
      '/api': {
        target: 'http://jk.fortunefreedom.top:10002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    },
    // 添加允许的主机列表，包含需要放行的所有域名
    allowedHosts: ['fortunefreedom.top','jk.fortunefreedom.top', 'localhost', 'chsiii.cn']
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));