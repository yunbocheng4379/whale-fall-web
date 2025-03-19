import { defineConfig } from 'umi';
import routes from './routes';

export default defineConfig({
  base: '/',
  publicPath: '/',
  outputPath: '../web',
  routes,
  antd: {},
  layout: {},
  model: {},
  initialState: {},
  dva: {},
  access: {},
  mock: {},
  history: { type: 'hash' },
  hash: true,
  npmClient: 'pnpm',
});
