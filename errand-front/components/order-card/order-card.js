Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 订单数据
    orderData: {
      type: Object,
      value: {}
    },
    // 是否显示详细信息
    showDetails: {
      type: Boolean,
      value: true
    },
    // 是否显示操作按钮
    showActions: {
      type: Boolean,
      value: true
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    defaultOrderData: {
      id: '',
      orderNo: '',
      type: '',
      status: '',
      statusText: '',
      statusClass: '',
      description: '',
      pickupLocation: '',
      deliveryLocation: '',
      createTime: '',
      expectedTime: '',
      contactInfo: '',
      price: '',
      tip: '',
      isMyOrder: false,
      tags: []
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 点击订单卡片
    onOrderTap: function(e) {
      // 阻止事件冒泡，避免与子组件冲突
      if (e.target.id !== 'order-card') {
        return
      }
      
      this.triggerEvent('orderTap', {
        orderData: this.properties.orderData
      })
    },

    // 点击联系方式
    onContactTap: function(e) {
      e.stopPropagation()
      const contactInfo = this.properties.orderData.contactInfo
      
      this.triggerEvent('contactTap', {
        contactInfo: contactInfo,
        orderData: this.properties.orderData
      })
    },

    // 接单
    onAcceptOrder: function(e) {
      e.stopPropagation()
      const orderId = e.currentTarget.dataset.id
      
      this.triggerEvent('acceptOrder', {
        orderId: orderId,
        orderData: this.properties.orderData
      })
    },

    // 取消订单
    onCancelOrder: function(e) {
      e.stopPropagation()
      const orderId = e.currentTarget.dataset.id
      
      this.triggerEvent('cancelOrder', {
        orderId: orderId,
        orderData: this.properties.orderData
      })
    },

    // 确认完成
    onCompleteOrder: function(e) {
      e.stopPropagation()
      const orderId = e.currentTarget.dataset.id
      
      this.triggerEvent('completeOrder', {
        orderId: orderId,
        orderData: this.properties.orderData
      })
    },

    // 完成订单
    onFinishOrder: function(e) {
      e.stopPropagation()
      const orderId = e.currentTarget.dataset.id
      
      this.triggerEvent('finishOrder', {
        orderId: orderId,
        orderData: this.properties.orderData
      })
    },

    // 查看详情
    onViewDetail: function(e) {
      e.stopPropagation()
      const orderId = e.currentTarget.dataset.id
      
      this.triggerEvent('viewDetail', {
        orderId: orderId,
        orderData: this.properties.orderData
      })
    },

    // 获取状态样式类
    getStatusClass: function(status) {
      const statusMap = {
        pending: 'status-pending',
        accepted: 'status-accepted',
        completed: 'status-completed',
        cancelled: 'status-cancelled'
      }
      return statusMap[status] || ''
    },

    // 格式化订单数据
    formatOrderData: function(orderData) {
      const defaultData = this.data.defaultOrderData
      const formattedData = Object.assign({}, defaultData, orderData)
      
      // 确保状态样式类
      if (!formattedData.statusClass) {
        formattedData.statusClass = this.getStatusClass(formattedData.status)
      }
      
      // 格式化价格
      if (formattedData.price) {
        formattedData.price = parseFloat(formattedData.price).toFixed(2)
      }
      
      if (formattedData.tip) {
        formattedData.tip = parseFloat(formattedData.tip).toFixed(2)
      }
      
      return formattedData
    }
  },

  /**
   * 组件生命周期函数，在组件布局完成后执行
   */
  ready: function() {
    // 格式化订单数据
    const formattedData = this.formatOrderData(this.properties.orderData)
    this.setData({
      orderData: formattedData
    })
  },

  /**
   * 组件生命周期函数，在组件实例进入页面节点树时执行
   */
  attached: function() {
    // 组件被添加到页面时执行
  },

  /**
   * 组件生命周期函数，在组件实例被从页面节点树移除时执行
   */
  detached: function() {
    // 组件从页面中移除时执行
  },

  /**
   * 监听属性值变化
   */
  observers: {
    'orderData': function(orderData) {
      if (orderData) {
        const formattedData = this.formatOrderData(orderData)
        this.setData({
          orderData: formattedData
        })
      }
    }
  }
})