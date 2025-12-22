Page({
  data: {
    // 帮助分类
    categories: [
      {
        id: 'common',
        name: '常见问题',
        icon: '❓',
        items: [
          { id: 1, title: '如何发布订单？', content: '点击底部发布按钮，填写订单信息即可发布。' },
          { id: 2, title: '如何接单？', content: '在订单页面点击感兴趣的任务，点击接单按钮即可。' },
          { id: 3, title: '如何修改个人信息？', content: '在个人中心点击头像或设置按钮即可修改。' }
        ]
      },
      {
        id: 'order',
        name: '订单问题',
        icon: '📋',
        items: [
          { id: 4, title: '订单被取消了怎么办？', content: '请联系发布者了解原因，或选择其他订单。' },
          { id: 5, title: '如何完成订单？', content: '按照订单要求完成任务后，点击完成订单按钮。' },
          { id: 6, title: '订单费用如何结算？', content: '订单完成后，费用会自动转入您的钱包。' }
        ]
      },
      {
        id: 'payment',
        name: '支付问题',
        icon: '💰',
        items: [
          { id: 7, title: '如何充值？', content: '在钱包页面点击充值按钮，选择金额进行充值。' },
          { id: 8, title: '如何提现？', content: '在钱包页面点击提现按钮，输入金额即可提现。' },
          { id: 9, title: '提现多久到账？', content: '提现申请提交后，预计1-3个工作日到账。' }
        ]
      },
      {
        id: 'account',
        name: '账户问题',
        icon: '👤',
        items: [
          { id: 10, title: '如何修改密码？', content: '在设置页面选择修改密码功能。' },
          { id: 11, title: '如何实名认证？', content: '在个人中心点击实名认证，填写信息并上传身份证照片。' },
          { id: 12, title: '忘记密码怎么办？', content: '在登录页面点击忘记密码，通过手机号重置。' }
        ]
      }
    ],
    
    // 当前选中的分类
    currentCategory: null,
    
    // 展开的帮助项
    expandedItems: [],
    
    // 搜索关键词
    searchKeyword: '',
    
    // 搜索结果
    searchResults: []
  },

  onLoad: function (options) {
    this.setData({
      currentCategory: this.data.categories[0]
    });
  },

  // 切换分类
  switchCategory: function (e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      currentCategory: category,
      expandedItems: [],
      searchKeyword: '',
      searchResults: []
    });
  },

  // 展开/收起帮助项
  toggleItem: function (e) {
    const itemId = e.currentTarget.dataset.id;
    const expandedItems = [...this.data.expandedItems];
    
    const index = expandedItems.indexOf(itemId);
    if (index > -1) {
      expandedItems.splice(index, 1);
    } else {
      expandedItems.push(itemId);
    }
    
    this.setData({ expandedItems });
  },

  // 搜索输入
  onSearchInput: function (e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    
    if (keyword.trim()) {
      this.searchHelp(keyword);
    } else {
      this.setData({ searchResults: [] });
    }
  },

  // 搜索帮助
  searchHelp: function (keyword) {
    const results = [];
    
    this.data.categories.forEach(category => {
      category.items.forEach(item => {
        if (item.title.includes(keyword) || item.content.includes(keyword)) {
          results.push({
            ...item,
            categoryName: category.name,
            categoryIcon: category.icon
          });
        }
      });
    });
    
    this.setData({ searchResults: results });
  },

  // 清空搜索
  clearSearch: function () {
    this.setData({
      searchKeyword: '',
      searchResults: []
    });
  },

  // 联系客服
  contactService: function () {
    wx.showActionSheet({
      itemList: ['在线客服', '电话客服'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 在线客服
          wx.navigateTo({
            url: '/pages/service/service'
          });
        } else if (res.tapIndex === 1) {
          // 电话客服
          wx.makePhoneCall({
            phoneNumber: '400-123-4567'
          });
        }
      }
    });
  }
});