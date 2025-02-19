<template>
  <div class="batch-calculation">
    <el-card class="calculation-card">
      <template #header>
        <div class="card-header">
          <h2>批量计算</h2>
        </div>
      </template>

      <el-form 
        ref="calculationForm"
        :model="calculationForm"
        :rules="rules"
        label-width="120px"
        class="calculation-form"
      >
        <el-form-item label="空投配置" prop="configId">
          <el-select
            v-model="calculationForm.configId"
            placeholder="请选择空投配置"
            style="width: 300px"
          >
            <el-option
              v-for="config in configs"
              :key="config._id"
              :label="formatConfigLabel(config)"
              :value="config._id"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            @click="startCalculation"
            :loading="calculating"
          >
            开始计算
          </el-button>
          <el-button 
            type="success" 
            @click="exportResults"
            :disabled="!results.length"
          >
            导出结果
          </el-button>
        </el-form-item>
      </el-form>

      <div v-if="results.length" class="result-section">
        <el-divider>计算结果</el-divider>
        
        <div class="table-header">
          <div class="table-title">
            共 {{ total }} 条记录
          </div>
          <div class="table-actions">
            <el-radio-group v-model="displayMode" size="small">
              <el-radio-button label="all">全部</el-radio-button>
              <el-radio-button label="valid">有效</el-radio-button>
              <el-radio-button label="invalid">无效</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <el-table 
          :data="filteredResults" 
          stripe 
          style="width: 100%"
          v-loading="calculating"
        >
          <el-table-column prop="address" label="用户地址" width="380" />
          <el-table-column prop="level1Count" label="一级推荐数" width="100" />
          <el-table-column prop="level2Count" label="二级推荐数" width="100" />
          <el-table-column prop="airdropAmount" label="空投数量" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status ? 'success' : 'danger'">
                {{ scope.row.status ? '有效' : '无效' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" />
        </el-table>

        <div class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredResults.length"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'BatchCalculation',
  data() {
    return {
      calculationForm: {
        configId: ''
      },
      rules: {
        configId: [
          { required: true, message: '请选择空投配置', trigger: 'change' }
        ]
      },
      configs: [],
      calculating: false,
      results: [],
      displayMode: 'all',
      currentPage: 1,
      pageSize: 20,
      total: 0
    }
  },
  computed: {
    filteredResults() {
      let filtered = this.results
      if (this.displayMode === 'valid') {
        filtered = this.results.filter(item => item.status)
      } else if (this.displayMode === 'invalid') {
        filtered = this.results.filter(item => !item.status)
      }
      return filtered
    }
  },
  mounted() {
    this.loadConfigs()
  },
  methods: {
    formatConfigLabel(config) {
      return `${config.totalAmount} (${new Date(config.startTime).toLocaleDateString()} - ${new Date(config.endTime).toLocaleDateString()})`
    },
    async loadConfigs() {
      try {
        const response = await fetch('/api/airdrop/configs')
        if (response.ok) {
          this.configs = await response.json()
        }
      } catch (error) {
        this.$message.error('加载空投配置失败')
      }
    },
    async startCalculation() {
      try {
        await this.$refs.calculationForm.validate()
        this.calculating = true
        
        const response = await fetch('/api/airdrop/calculate-batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            configId: this.calculationForm.configId
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          this.results = data.results
          this.total = data.total
          this.$message.success('计算完成')
        } else {
          throw new Error('计算失败')
        }
      } catch (error) {
        this.$message.error(error.message || '批量计算失败')
      } finally {
        this.calculating = false
      }
    },
    exportResults() {
      const headers = ['用户地址', '一级推荐数', '二级推荐数', '空投数量', '状态', '备注']
      const data = this.filteredResults.map(item => [
        item.address,
        item.level1Count,
        item.level2Count,
        item.airdropAmount,
        item.status ? '有效' : '无效',
        item.remark
      ])
      
      const csvContent = [
        headers.join(','),
        ...data.map(row => row.join(','))
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `airdrop_results_${new Date().toISOString()}.csv`
      link.click()
    },
    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1
    },
    handleCurrentChange(val) {
      this.currentPage = val
    }
  }
}
</script>

<style scoped>
.batch-calculation {
  padding: 20px;
}

.calculation-card {
  max-width: 1200px;
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

.calculation-form {
  margin-top: 20px;
}

.result-section {
  margin-top: 30px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-title {
  font-size: 14px;
  color: #666;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

@media (max-width: 768px) {
  .calculation-card {
    margin: 0 10px;
  }
  
  .el-select {
    width: 100% !important;
  }
}
</style> 