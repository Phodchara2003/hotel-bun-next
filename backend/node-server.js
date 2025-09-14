// Simple backend server using built-in Node.js modules
import { createServer } from 'http';
import { parse } from 'url';

const PORT = 3003;

const server = createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse URL
  const parsedUrl = parse(req.url, true);
  const path = parsedUrl.pathname;

  // Set content type
  res.setHeader('Content-Type', 'application/json');

  // Routes
  if (path === '/') {
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'Hotel Booking API Server is running!',
      status: 'OK',
      timestamp: new Date().toISOString(),
      port: PORT
    }));
  } else if (path === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }));
  } else if (path === '/api/test') {
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'API endpoint working',
      data: {
        server: 'Node.js HTTP Server',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({
      error: 'Not Found',
      message: `Path ${path} not found`
    }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Backend server is running on http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log(`   GET http://localhost:${PORT}/        - Server info`);
  console.log(`   GET http://localhost:${PORT}/health  - Health check`);
  console.log(`   GET http://localhost:${PORT}/api/test - API test`);
});