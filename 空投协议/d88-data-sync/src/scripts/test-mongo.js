const MongoClient = require('mongodb').MongoClient;

async function testMongo() {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', {
            useUnifiedTopology: true,
            useNewUrlParser: true
        });
        
        console.log('MongoDB连接成功');
        const db = client.db('d88');
        
        // 测试查询
        const count = await db.collection('users').countDocuments();
        console.log('users集合中的文档数量:', count);
        
        await client.close();
    } catch (error) {
        console.error('连接错误:', error);
    }
}

testMongo(); 