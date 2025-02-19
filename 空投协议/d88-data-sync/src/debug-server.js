const http = require('http');

process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
});

try {
    const server = http.createServer((req, res) => {
        try {
            console.log('收到请求:', {
                url: req.url,
                method: req.method,
                headers: req.headers
            });
            
            res.writeHead(200, {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*'
            });
            res.end('测试成功\n');
        } catch (error) {
            console.error('处理请求时出错:', error);
            res.writeHead(500);
            res.end('服务器错误');
        }
    });

    const PORT = 9000;

    server.on('error', (error) => {
        console.error('服务器错误:', error);
        if (error.code === 'EADDRINUSE') {
            console.log('端口已被占用，请尝试其他端口');
        }
    });

    server.on('listening', () => {
        const addr = server.address();
        console.log('服务器启动信息:');
        console.log('- 端口:', addr.port);
        console.log('- 地址:', addr.address);
        console.log('- 协议族:', addr.family);
    });

    console.log('正在启动服务器...');
    server.listen(PORT, () => {
        console.log('服务器启动成功!');
        console.log(`请通过以下地址访问:`);
        console.log(`1. http://localhost:${PORT}`);
        console.log(`2. http://127.0.0.1:${PORT}`);
    });
} catch (error) {
    console.error('启动服务器时出错:', error);
} 