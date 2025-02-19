<template>
  <div class="airdrop-config">
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <h2>空投配置</h2>
        </div>
      </template>

      <el-form 
        ref="configForm"
        :model="configForm"
        :rules="rules"
        label-width="120px"
        class="config-form"
      >
        <el-form-item label="总空投数量" prop="totalAmount">
          <el-input-number 
            v-model="configForm.totalAmount"
            :min="0"
            :precision="2"
            :step="1000"
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="一级推荐比例" prop="level1Ratio">
          <el-slider
            v-model="configForm.level1Ratio"
            :min="0"
            :max="100"
            :step="1"
            :format-tooltip="formatRatio"
            style="width: 300px"
          />
        </el-form-item>

        <el-form-item label="二级推荐比例" prop="level2Ratio">
          <el-slider
            v-model="configForm.level2Ratio"
            :min="0"
            :max="100"
            :step="1"
            :format-tooltip="formatRatio"
            style="width: 300px"
          />
        </el-form-item>

        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="configForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker
            v-model="configForm.endTime"
            type="datetime"
            placeholder="选择结束时间"
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm">保存配置</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'AirdropConfig',
  data() {
    return {
      configForm: {
        totalAmount: 1000000,
        level1Ratio: 60,
        level2Ratio: 40,
        startTime: '',
        endTime: ''
      },
      rules: {
        totalAmount: [
          { required: true, message: '请输入总空投数量', trigger: 'blur' },
          { type: 'number', min: 0, message: '数量必须大于0', trigger: 'blur' }
        ],
        level1Ratio: [
          { required: true, message: '请设置一级推荐比例', trigger: 'blur' }
        ],
        level2Ratio: [
          { required: true, message: '请设置二级推荐比例', trigger: 'blur' }
        ],
        startTime: [
          { required: true, message: '请选择开始时间', trigger: 'change' }
        ],
        endTime: [
          { required: true, message: '请选择结束时间', trigger: 'change' }
        ]
      }
    }
  },
  methods: {
    formatRatio(val) {
      return val + '%'
    },
    async submitForm() {
      try {
        await this.$refs.configForm.validate()
        // TODO: 发送配置到后端
        const response = await fetch('/api/airdrop/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.configForm)
        })
        
        if (response.ok) {
          this.$message.success('配置保存成功')
        } else {
          throw new Error('保存失败')
        }
      } catch (error) {
        this.$message.error(error.message || '保存配置失败')
      }
    },
    resetForm() {
      this.$refs.configForm.resetFields()
    }
  }
}
</script>

<style scoped>
.airdrop-config {
  padding: 20px;
}

.config-card {
  max-width: 800px;
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

.config-form {
  margin-top: 20px;
}

@media (max-width: 768px) {
  .config-card {
    margin: 0 10px;
  }
}
</style> 