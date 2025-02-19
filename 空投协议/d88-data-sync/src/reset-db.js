const { connectMongoDB, mongoose } = require('./config/database');

async function resetDatabase() {
    try {
        // 连接数据库
        await connectMongoDB();
        console.log('数据库连接成功');

        // 删除所有集合
        const collections = await mongoose.connection.db.collections();
        for (let collection of collections) {
            await collection.drop();
            console.log(`删除集合: ${collection.collectionName}`);
        }

        // 删除数据库
        await mongoose.connection.db.dropDatabase();
        console.log('数据库已重置');

        process.exit(0);
    } catch (error) {
        console.error('重置数据库失败:', error);
        process.exit(1);
    }
}

resetDatabase(); 