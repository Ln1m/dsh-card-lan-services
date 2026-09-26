// DSH 局域网服务 · 通用静态站点服务器
// 用法（两种都支持）：
//   node static-server.cjs <端口>                         ← 面板「启动」按钮走这个形式，站点信息读同目录 sites.json
//   node static-server.cjs --port 3095 --root "D:\..." [--index 首页.html] [--title 名字]
// 站点注册表：同目录 sites.json，形如 { "3095": { "title": "…", "root": "…", "index": "…" } }
// 日志：同目录 logs/server-<端口>.log（无控制台输出，便于被托管启动）
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const HERE = __dirname;
const SITES_FILE = path.join(HERE, 'sites.json');
const LOG_DIR = path.join(HERE, 'logs');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--port') out.port = argv[++i];
    else if (a === '--root') out.root = argv[++i];
    else if (a === '--index') out.index = argv[++i];
    else if (a === '--title') out.title = argv[++i];
    else if (/^\d{2,5}$/.test(a) && !out.port) out.port = a;
  }
  return out;
}

function readSites() {
  try { return JSON.parse(fs.readFileSync(SITES_FILE, 'utf8')) || {}; } catch (e) { return {}; }
}

const args = parseArgs(process.argv.slice(2));
const PORT = parseInt(args.port || process.env.LAN_PORT || '0', 10);
const LOG_FILE = path.join(LOG_DIR, 'server-' + (PORT || 'x') + '.log');

function log(msg) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(LOG_FILE, new Date().toISOString() + ' ' + msg + '\n');
  } catch (e) { /* 静默 */ }
}

if (!PORT) {
  console.error('用法: node static-server.cjs <端口>');
  process.exit(2);
}

const site = readSites()[String(PORT)] || {};
const RAW_ROOT = args.root || site.root || '';
if (!RAW_ROOT) {
  log('NO_ROOT: sites.json 无 ' + PORT + ' 的 root，命令行也没给 --root');
  console.error('缺少站点根目录');
  process.exit(3);
}
const ROOT = path.resolve(RAW_ROOT);
if (!fs.existsSync(ROOT)) {
  log('ROOT_MISSING ' + ROOT);
  console.error('站点根目录不存在: ' + ROOT);
  process.exit(4);
}
const INDEX = args.index || site.index || 'index.html';
const TITLE = args.title || site.title || ('服务 :' + PORT);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff'
};

function lanUrls(port) {
  const out = [];
  const ifs = os.networkInterfaces();
  Object.keys(ifs).forEach((name) => {
    (ifs[name] || []).forEach((a) => {
      if (a.family === 'IPv4' && !a.internal) out.push('http://' + a.address + ':' + port);
    });
  });
  return out;
}

function sendFile(file, res, reqUrl) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 - ' + reqUrl);
      return;
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    const stream = fs.createReadStream(file);
    stream.on('error', () => { try { res.end(); } catch (e) {} });
    stream.pipe(res);
  });
}

const server = http.createServer((req, res) => {
  let reqUrl;
  try {
    reqUrl = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch (e) {
    res.writeHead(400); res.end('400'); return;
  }
  try {
    if (reqUrl === '/api/net') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ urls: lanUrls(PORT), port: PORT, root: ROOT, index: INDEX, title: TITLE }));
      return;
    }
    if (reqUrl === '') reqUrl = '/';
    const target = path.resolve(path.join(ROOT, path.normalize(reqUrl)));
    const rel = path.relative(ROOT, target);
    if (rel.startsWith('..') || path.isAbsolute(rel)) { res.writeHead(403); res.end('403'); return; }
    fs.stat(target, (err, st) => {
      if (!err && st.isDirectory()) { sendFile(path.join(target, INDEX), res, reqUrl); return; }
      if (err || !st.isFile()) { sendFile(target, res, reqUrl); return; }
      sendFile(target, res, reqUrl);
    });
  } catch (e) {
    log('request error: ' + (e && e.message));
    res.writeHead(500); res.end('500');
  }
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') log('PORT_IN_USE ' + PORT);
  else log('server error: ' + e.code + ' ' + e.message);
});

server.listen(PORT, '0.0.0.0', () => {
  log('started port=' + PORT + ' title=' + TITLE + ' root=' + ROOT + ' urls=' + lanUrls(PORT).join(' '));
});
