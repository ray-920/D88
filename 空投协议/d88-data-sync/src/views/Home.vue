<template>
  <div class="home">
    <el-row :gutter="20" class="welcome-section">
      <el-col :span="24">
        <h1>欢迎使用 D88 空投系统</h1>
        <p class="subtitle">高效、安全的空投管理平台</p>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="feature-cards">
      <el-col :xs="24" :sm="8">
        <el-card class="feature-card" :body-style="{ height: '200px' }">
          <template #header>
            <div class="card-header">
              <h3>空投配置</h3>
            </div>
          </template>
          <div class="card-content">
            <el-icon size="40" color="#409EFF"><Setting /></el-icon>
            <p>设置空投规则、分配比例和时间范围</p>
            <el-button type="primary" @click="$router.push('/config')">立即配置</el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="8">
        <el-card class="feature-card" :body-style="{ height: '200px' }">
          <template #header>
            <div class="card-header">
              <h3>用户查询</h3>
            </div>
          </template>
          <div class="card-content">
            <el-icon size="40" color="#409EFF"><Search /></el-icon>
            <p>查询用户的空投数量和推荐关系</p>
            <el-button type="primary" @click="$router.push('/search')">开始查询</el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="8">
        <el-card class="feature-card" :body-style="{ height: '200px' }">
          <template #header>
            <div class="card-header">
              <h3>批量计算</h3>
            </div>
          </template>
          <div class="card-content">
            <el-icon size="40" color="#409EFF"><Files /></el-icon>
            <p>批量计算和导出空投数据</p>
            <el-button type="primary" @click="$router.push('/batch')">开始计算</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="stats-section">
      <el-col :span="24">
        <el-card class="stats-card" v-loading="loading">
          <template #header>
            <div class="card-header">
              <h3>系统概况</h3>
              <el-button :icon="Refresh" circle @click="fetchStats" />
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="stat-item">
                <h4>总用户数</h4>
                <p class="stat-number">{{ formatNumber(stats.userCount) }}</p>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <h4>已发放空投</h4>
                <p class="stat-number">{{ formatNumber(stats.airdropAmount, 4) }}</p>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <h4>活跃推荐人</h4>
                <p class="stat-number">{{ formatNumber(stats.referrerCount) }}</p>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { Setting, Search, Files, Refresh } from '@element-plus/icons-vue'
import { airdropApi } from '@/services/api'
import { formatNumber } from '@/utils'

export default {
  name: 'Home',
  components: {
    Setting,
    Search,
    Files
  },
  data() {
    return {
      stats: {
        userCount: 0,
        airdropAmount: 0,
        referrerCount: 0
      },
      loading: false,
      Refresh
    }
  },
  mounted() {
    this.fetchStats()
  },
  methods: {
    formatNumber,
    async fetchStats() {
      try {
        this.loading = true
        const data = await airdropApi.getStats()
        this.stats = data
      } catch (error) {
        this.$message.error('获取统计数据失败：' + error.message)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.home {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.welcome-section {
  text-align: center;
  margin-bottom: 40px;
}

.welcome-section h1 {
  font-size: 2.5em;
  color: #409EFF;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 1.2em;
  color: #666;
}

.feature-cards {
  margin-bottom: 40px;
}

.feature-card {
  height: 100%;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #409EFF;
}

.card-content {
  text-align: center;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.card-content p {
  margin: 15px 0;
  color: #666;
}

.stats-section {
  margin-top: 40px;
}

.stat-item {
  text-align: center;
  padding: 20px;
}

.stat-item h4 {
  color: #666;
  margin-bottom: 10px;
}

.stat-number {
  font-size: 2em;
  color: #409EFF;
  font-weight: bold;
}

@media (max-width: 768px) {
  .feature-cards .el-col {
    margin-bottom: 20px;
  }
}
</style> 