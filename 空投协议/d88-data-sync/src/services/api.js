import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 响应拦截器
api.interceptors.response.use(
  response => response.data,
  error => {
    const message = error.response?.data?.message || error.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)

export const airdropApi = {
  // 获取系统统计数据
  getStats() {
    return api.get('/stats')
  },

  // 创建空投配置
  createConfig(config) {
    return api.post('/airdrop/config', config)
  },

  // 获取所有空投配置
  getConfigs() {
    return api.get('/airdrop/configs')
  },

  // 获取用户空投信息
  getUserAirdrop(address) {
    return api.get(`/airdrop/amount/${address}`)
  },

  // 批量计算空投
  calculateBatch(configId) {
    return api.post('/airdrop/calculate-batch', { configId })
  },

  // 更新用户推荐统计
  updateReferralStats(address, stats) {
    return api.post('/airdrop/update-referral', {
      address,
      ...stats
    })
  }
}

export default api 