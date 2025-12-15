const app = getApp()

Page({
  data: {
    currentTab: 0,
    tabs: ['全部', '待接单', '进行中', '已完成'],
    orderList: [
      {
        id: 1,
        orderNo: 'ER20231215001',
        type: '快递代取',
        status: 'pending',
        statusText: '待接单',
        statusClass: 'status-pending',
        description: '帮忙取一下顺丰快递，在菜鸟驿站，送到宿舍楼下',
        pickupLocation: '菜鸟驿站',
        deliveryLocation: '宿舍A栋楼下',
        createTime: '10分钟前',
        expectedTime: '今天 18:00前',
        price: '8.00',
        tip: '2.00',
        isMyOrder: false
      },
      {
        id: 2,
        orderNo: 'ER20231215002',
        type: '外卖配送',
        status: 'accepted',
        statusText: '进行中',
        statusClass: 'status-warning',
        description: '帮忙送一份外卖到宿舍楼下',
        pickupLocation: '食堂二楼',
        deliveryLocation: '宿舍B栋楼下',
        createTime: '30分钟前',
        expectedTime: '今天 17:30前',
        price: '6.00',
        tip: '1.00',
        isMyOrder: true
      },
      {
        id: 3,
        orderNo: 'ER20231215003',
        type: '代购服务',
        status: 'completed',
        statusText: '已完成',
        statusClass: 'status-completed',
        description: '帮忙买一瓶矿泉水和一包薯片',
        pickupLocation: '校内超市',
        deliveryLocation: '图书馆',
        createTime: '1小时前',
        price: '5.00',
        tip: '0',
        isMyOrder: false
      }
    ],
    filteredOrders: []
  },

  onLoad: function (options) {
    console.log('订单页面加载')
    this.filterOrders()
  },

  onShow: function () {
    console.log('订单页面显示')
    this.loadOrderList()
  },

  onPullDownRefresh: function () {
    console.log('下拉刷新')
    this.loadOrderList()
    wx.stopPullDownRefresh()
  },

  // 加载订单列表
  loadOrderList: function () {
    // 这里应该调用API获取订单列表
    console.log('加载订单列表')
    this.filterOrders()
  },

  // 切换标签
  switchTab: function (e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      currentTab: index
    })
    this.filterOrders()
  },

  // 过滤订单
  filterOrders: function () {
    const { currentTab, orderList } = this.data
    let filteredOrders = []

    switch (currentTab) {
      case 0: // 全部
        filteredOrders = orderList
        break
      case 1: // 待接单
        filteredOrders = orderList.filter(order => order.status === 'pending')
        break
      case 2: // 进行中
        filteredOrders = orderList.filter(order => order.status === 'accepted')
        break
      case 3: // 已完成
        filteredOrders = orderList.filter(order => order.status === 'completed')
        break
    }

    this.setData({
      filteredOrders: filteredOrders
    })
  },

  // 点击订单
  onOrderTap: function (e) {
    const orderId = e.currentTarget.dataset.id
    console.log('查看订单详情:', orderId)
    wx.navigateTo({
      url: `/pages/detail/detail?id=${orderId}`
    })
  },

  // 接单
  onAcceptOrder: function (e) {
    const orderId = e.currentTarget.dataset.id
    console.log('接受订单:', orderId)
    
    if (!app.globalData.isLogin) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再接单',
        showCancel: false,
        success: () => {
          wx.navigateTo({
            url: '/pages/login/login'
          })
        }
      })
      return
    }

    wx.showModal({
      title: '确认接单',
      content: '确定要接受这个订单吗？',
      success: (res) => {
        if (res.confirm) {
          this.acceptOrder(orderId)
        }
      }
    })
  },

  // 执行接单
  acceptOrder: function (orderId) {
    wx.showLoading({
      title: '接单中...'
    })

    // 这里应该调用接单API
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({
        title: '接单成功',
        icon: 'success'
      })
      this.loadOrderList()
    }, 1000)
  },

  // 取消订单
  onCancelOrder: function (e) {
    const orderId = e.currentTarget.dataset.id
    console.log('取消订单:', orderId)

    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个订单吗？',
      success: (res) => {
        if (res.confirm) {
          this.cancelOrder(orderId)
        }
      }
    })
  },

  // 执行取消订单
  cancelOrder: function (orderId) {
    wx.showLoading({
      title: '取消中...'
    })

    // 这里应该调用取消订单API
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({
        title: '已取消订单',
        icon: 'success'
      })
      this.loadOrderList()
    }, 1000)
  },

  // 确认完成
  onCompleteOrder: function (e) {
    const orderId = e.currentTarget.dataset.id
    console.log('确认完成订单:', orderId)

    wx.showModal({
      title: '确认完成',
      content: '确定订单已完成吗？',
      success: (res) => {
        if (res.confirm) {
          this.completeOrder(orderId)
        }
      }
    })
  },

  // 完成订单
  onFinishOrder: function (e) {
    const orderId = e.currentTarget.dataset.id
    console.log('完成订单:', orderId)

    wx.showModal({
      title: '确认完成',
      content: '确定订单已完成吗？',
      success: (res) => {
        if (res.confirm) {
          this.completeOrder(orderId)
        }
      }
    })
  },

  // 执行完成订单
  completeOrder: function (orderId) {
    wx.showLoading({
      title: '处理中...'
    })

    // 这里应该调用完成订单API
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({
        title: '订单已完成',
        icon: 'success'
      })
      this.loadOrderList()
    }, 1000)
  },

  // 查看详情
  onViewDetail: function (e) {
    const orderId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${orderId}`
    })
  }
})