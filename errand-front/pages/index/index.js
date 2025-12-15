const app = getApp()

Page({
  data: {
    searchKeyword: '',
    serviceTypes: [
      { id: 1, name: '快递代取', icon: '/images/express.png' },
      { id: 2, name: '外卖配送', icon: '/images/food.png' },
      { id: 3, name: '代购服务', icon: '/images/shopping.png' },
      { id: 4, name: '其他服务', icon: '/images/other.png' }
    ],
    orderList: [
      {
        id: 1,
        type: '快递代取',
        statusText: '待接单',
        statusClass: 'status-pending',
        description: '帮忙取一下顺丰快递，在菜鸟驿站',
        location: '菜鸟驿站',
        createTime: '10分钟前',
        price: '5.00'
      },
      {
        id: 2,
        type: '外卖配送',
        statusText: '待接单',
        statusClass: 'status-pending',
        description: '帮忙送一份外卖到宿舍楼下',
        location: '食堂二楼',
        createTime: '15分钟前',
        price: '8.00'
      },
      {
        id: 3,
        type: '代购服务',
        statusText: '已完成',
        statusClass: 'status-completed',
        description: '帮忙买一瓶矿泉水',
        location: '超市',
        createTime: '30分钟前',
        price: '3.00'
      }
    ]
  },

  onLoad: function (options) {
    console.log('首页加载')
    this.loadOrderList()
  },

  onShow: function () {
    console.log('首页显示')
  },

  onPullDownRefresh: function () {
    console.log('下拉刷新')
    this.loadOrderList()
    wx.stopPullDownRefresh()
  },

  onReachBottom: function () {
    console.log('上拉加载更多')
    this.loadMoreOrders()
  },

  // 加载订单列表
  loadOrderList: function () {
    // 这里应该调用API获取订单列表
    console.log('加载订单列表')
  },

  // 加载更多订单
  loadMoreOrders: function () {
    // 这里应该调用API获取更多订单
    console.log('加载更多订单')
  },

  // 搜索输入
  onSearchInput: function (e) {
    this.setData({
      searchKeyword: e.detail.value
    })
  },

  // 搜索
  onSearch: function () {
    console.log('搜索关键词:', this.data.searchKeyword)
    // 这里应该调用搜索API
  },

  // 点击服务类型
  onServiceTap: function (e) {
    const { id, name } = e.currentTarget.dataset
    console.log('选择服务类型:', id, name)
    // 可以跳转到对应的服务列表页面
    wx.navigateTo({
      url: `/pages/service/service?type=${id}&name=${name}`
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

  // 查看更多
  onViewMore: function () {
    wx.navigateTo({
      url: '/pages/order/order'
    })
  },

  // 发布订单
  onPublishOrder: function () {
    if (!app.globalData.isLogin) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再发布订单',
        showCancel: false,
        success: () => {
          wx.navigateTo({
            url: '/pages/login/login'
          })
        }
      })
      return
    }

    wx.navigateTo({
      url: '/pages/publish/publish'
    })
  }
})