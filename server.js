const http = require('http');
const fs   = require('fs');
const path = require('path');

const ROOT = 'c:/Users/Maria/OneDrive/Desktop/Anniversary';
const PORT = 3000;

const MIME = {
  html: 'text/html; charset=utf-8',
  css:  'text/css; charset=utf-8',
  js:   'application/javascript; charset=utf-8',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  png:  'image/png',
  gif:  'image/gif',
  mp3:  'audio/mpeg',
  webm: 'video/webm',
  mov:  'video/quicktime',
  svg:  'image/svg+xml',
  ico:  'image/x-icon',
};

http.createServer((req, res) => {
  // Decode URL components so filenames with spaces like "1st day.jpg" work cleanly
  const cleanUrl = decodeURIComponent(req.url.split('?')[0]);
  const urlPath  = cleanUrl === '/' ? '/index.html' : cleanUrl;
  const filePath = path.join(ROOT, urlPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found: ' + cleanUrl);
      return;
    }

    const ext  = path.extname(filePath).slice(1).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';

    // Support Audio Range Requests for smooth seeking / streaming
    const range = req.headers.range;
    if (range && ext === 'mp3') {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end   = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunkSize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': type,
      });
      file.pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': stats.size,
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(filePath).pipe(res);
  });

}).listen(PORT, () => {
  console.log(`\n💜 Anniversary site running smoothly at http://localhost:${PORT}\n`);
});
