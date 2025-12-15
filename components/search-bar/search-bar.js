const util = require('../../utils/util.js')

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 占位符文本
    placeholder: {
      type: String,
      value: '请输入搜索内容'
    },
    // 输入框值
    value: {
      type: String,
      value: ''
    },
    // 是否显示清除按钮
    showClear: {
      type: Boolean,
      value: true
    },
    // 是否显示搜索按钮
    showSearchButton: {
      type: Boolean,
      value: false
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      value: false
    },
    // 最大输入长度
    maxLength: {
      type: Number,
      value: 100
    },
    // 是否显示搜索建议
    showSuggestions: {
      type: Boolean,
      value: false
    },
    // 搜索建议列表
    suggestions: {
      type: Array,
      value: []
    },
    // 是否显示搜索历史
    showHistory: {
      type: Boolean,
      value: true
    },
    // 历史记录存储key
    historyKey: {
      type: String,
      value: 'searchHistory'
    },
    // 历史记录最大数量
    maxHistory: {
      type: Number,
      value: 10
    },
    // 自定义样式类
    customClass: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    searchHistory: [],
    isFocused: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 输入事件
    onInput: function(e) {
      const value = e.detail.value
      this.setData({ value })
      
      // 触发输入事件
      this.triggerEvent('input', { value })
      
      // 如果启用了搜索建议，触发搜索建议事件
      if (this.properties.showSuggestions) {
        this.triggerEvent('suggestion', { value })
      }
    },

    // 搜索事件
    onSearch: function() {
      const value = this.data.value.trim()
      
      if (!value) {
        return
      }

      // 添加到搜索历史
      this.addToHistory(value)
      
      // 触发搜索事件
      this.triggerEvent('search', { value })
      
      // 如果显示搜索建议，隐藏建议列表
      if (this.properties.showSuggestions) {
        this.setData({ suggestions: [] })
      }
    },

    // 获取焦点
    onFocus: function(e) {
      this.setData({ isFocused: true })
      this.triggerEvent('focus', e)
      
      // 如果有搜索建议，触发获取搜索建议
      if (this.properties.showSuggestions) {
        this.triggerEvent('getsuggestions', { value: e.detail.value })
      }
    },

    // 失去焦点
    onBlur: function(e) {
      // 延迟设置焦点状态，避免点击建议时先失去焦点
      setTimeout(() => {
        this.setData({ isFocused: false })
      }, 200)
      
      this.triggerEvent('blur', e)
    },

    // 清除输入
    onClear: function() {
      this.setData({ value: '' })
      this.triggerEvent('input', { value: '' })
      this.triggerEvent('clear')
    },

    // 点击搜索建议
    onSuggestionTap: function(e) {
      const value = e.currentTarget.dataset.value
      this.setData({ value })
      
      // 添加到搜索历史
      this.addToHistory(value)
      
      this.triggerEvent('suggestionTap', { value })
      this.triggerEvent('search', { value })
    },

    // 点击历史记录
    onHistoryTap: function(e) {
      const value = e.currentTarget.dataset.value
      this.setData({ value })
      
      this.triggerEvent('historyTap', { value })
      this.triggerEvent('search', { value })
    },

    // 清空历史记录
    onClearHistory: function() {
      wx.showModal({
        title: '提示',
        content: '确定要清空搜索历史吗？',
        success: (res) => {
          if (res.confirm) {
            this.clearHistory()
            this.triggerEvent('clearHistory')
          }
        }
      })
    },

    // 添加到搜索历史
    addToHistory: function(keyword) {
      if (!keyword.trim()) {
        return
      }

      let history = this.loadHistory()
      
      // 移除重复项
      history = history.filter(item => item !== keyword)
      
      // 添加到开头
      history.unshift(keyword)
      
      // 限制数量
      if (history.length > this.properties.maxHistory) {
        history = history.slice(0, this.properties.maxHistory)
      }
      
      // 保存到本地存储
      try {
        wx.setStorageSync(this.properties.historyKey, history)
        this.setData({ searchHistory: history })
      } catch (e) {
        console.error('保存搜索历史失败:', e)
      }
    },

    // 加载搜索历史
    loadHistory: function() {
      try {
        const history = wx.getStorageSync(this.properties.historyKey) || []
        return Array.isArray(history) ? history : []
      } catch (e) {
        console.error('加载搜索历史失败:', e)
        return []
      }
    },

    // 清空历史记录
    clearHistory: function() {
      try {
        wx.removeStorageSync(this.properties.historyKey)
        this.setData({ searchHistory: [] })
      } catch (e) {
        console.error('清空搜索历史失败:', e)
      }
    },

    // 获取搜索历史（供外部调用）
    getHistory: function() {
      return this.data.searchHistory
    },

    // 设置搜索建议（供外部调用）
    setSuggestions: function(suggestions) {
      this.setData({ suggestions })
    }
  },

  /**
   * 组件生命周期函数，在组件实例进入页面节点树时执行
   */
  attached: function() {
    // 加载搜索历史
    const history = this.loadHistory()
    this.setData({ searchHistory: history })
  },

  /**
   * 组件生命周期函数，在组件实例被从页面节点树移除时执行
   */
  detached: function() {
    // 组件卸载时清理
  },

  /**
   * 监听属性值变化
   */
  observers: {
    'value': function(value) {
      // 监听外部传入的value变化
      if (value !== this.data.value) {
        this.setData({ value })
      }
    }
  }
})