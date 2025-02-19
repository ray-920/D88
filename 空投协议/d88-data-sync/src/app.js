const express = require('express');
const cors = require('cors');
const { connectMongoDB } = require('./config/database');
const airdropRoutes = require('./routes/airdrop');

const app = express();

// 连接数据库
connectMongoDB();

// 中间件
app.use(cors());
app.use(express.json());

// 空投相关路由
app.use('/api/airdrop', airdropRoutes);

// 错误处理
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: err.message || '服务器内部错误'
    });
});

// 启动服务器
const PORT = 9000;
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
}); 