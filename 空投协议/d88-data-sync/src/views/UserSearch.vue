<template>
  <div class="user-search">
    <el-card class="search-card">
      <template #header>
        <div class="card-header">
          <h2>用户查询</h2>
        </div>
      </template>

      <el-form 
        ref="searchForm"
        :model="searchForm"
        :rules="rules"
        label-width="100px"
        class="search-form"
      >
        <el-form-item label="用户地址" prop="address">
          <el-input
            v-model="searchForm.address"
            placeholder="请输入用户钱包地址"
            clearable
            style="width: 400px"
          >
            <template #append>
              <el-button @click="searchUser" :loading="loading">
                查询
              </el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>

      <div v-if="hasSearched" class="result-section">
        <el-divider>查询结果</el-divider>
        
        <div v-if="userInfo" class="user-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="用户地址">
              {{ userInfo.address }}
            </el-descriptions-item>
            <el-descriptions-item label="推荐人">
              {{ userInfo.referrer || '无' }}
            </el-descriptions-item>
            <el-descriptions-item label="一级推荐数">
              {{ userInfo.level1Count }}
            </el-descriptions-item>
            <el-descriptions-item label="二级推荐数">
              {{ userInfo.level2Count }}
            </el-descriptions-item>
            <el-descriptions-item label="预计空投数量">
              {{ userInfo.airdropAmount }}
            </el-descriptions-item>
            <el-descriptions-item label="加入时间">
              {{ formatTime(userInfo.joinTime) }}
            </el-descriptions-item>
          </el-descriptions>

          <div v-if="userInfo.level1Referrals.length > 0" class="referrals-section">
            <h3>一级推荐列表</h3>
            <el-table :data="userInfo.level1Referrals" stripe style="width: 100%">
              <el-table-column prop="address" label="地址" width="380" />
              <el-table-column prop="joinTime" label="加入时间" :formatter="formatTimeColumn" />
              <el-table-column prop="referralCount" label="推荐人数" width="100" />
            </el-table>
          </div>

          <div v-if="userInfo.level2Referrals.length > 0" class="referrals-section">
            <h3>二级推荐列表</h3>
            <el-table :data="userInfo.level2Referrals" stripe style="width: 100%">
              <el-table-column prop="address" label="地址" width="380" />
              <el-table-column prop="joinTime" label="加入时间" :formatter="formatTimeColumn" />
              <el-table-column prop="referralCount" label="推荐人数" width="100" />
            </el-table>
          </div>
        </div>

        <el-empty v-else description="未找到用户信息" />
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'UserSearch',
  data() {
    return {
      searchForm: {
        address: ''
      },
      rules: {
        address: [
          { required: true, message: '请输入用户地址', trigger: 'blur' },
          { pattern: /^0x[a-fA-F0-9]{40}$/, message: '请输入有效的以太坊地址', trigger: 'blur' }
        ]
      },
      loading: false,
      hasSearched: false,
      userInfo: null
    }
  },
  methods: {
    formatTime(timestamp) {
      if (!timestamp) return '未知'
      return new Date(timestamp).toLocaleString()
    },
    formatTimeColumn(row, column, cellValue) {
      return this.formatTime(cellValue)
    },
    async searchUser() {
      try {
        await this.$refs.searchForm.validate()
        this.loading = true
        
        // TODO: 调用后端 API
        const response = await fetch(`/api/airdrop/amount/${this.searchForm.address}`)
        if (response.ok) {
          this.userInfo = await response.json()
        } else {
          throw new Error('查询失败')
        }
      } catch (error) {
        this.$message.error(error.message || '查询用户信息失败')
        this.userInfo = null
      } finally {
        this.loading = false
        this.hasSearched = true
      }
    }
  }
}
</script>

<style scoped>
.user-search {
  padding: 20px;
}

.search-card {
  max-width: 1000px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  color: #409EFF;
}

.search-form {
  margin-top: 20px;
}

.result-section {
  margin-top: 30px;
}

.referrals-section {
  margin-top: 30px;
}

.referrals-section h3 {
  color: #409EFF;
  margin-bottom: 15px;
}

@media (max-width: 768px) {
  .search-card {
    margin: 0 10px;
  }
  
  .el-input {
    width: 100% !important;
  }
}
</style> 