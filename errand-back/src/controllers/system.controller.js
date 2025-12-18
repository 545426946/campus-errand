// 系统配置控制器

// 获取系统配置
exports.getConfig = async (req, res, next) => {
  try {
    res.json({
      success: true,
      code: 0,
      data: {
        appName: '校园跑腿',
        version: '1.0.0',
        apiBaseUrl: process.env.API_BASE_URL || 'http://192.168.1.133:3000/api',
        uploadMaxSize: 10 * 1024 * 1024, // 10MB
        orderMinPrice: 1,
        orderMaxPrice: 1000,
        withdrawMinAmount: 10,
        serviceTypes: ['快递代取', '食堂代购', '打印复印', '其他服务']
      },
      message: '获取系统配置成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取服务类型列表
exports.getServiceTypes = async (req, res, next) => {
  try {
    res.json({
      success: true,
      code: 0,
      data: [
        { id: 1, name: '快递代取', icon: 'express' },
        { id: 2, name: '食堂代购', icon: 'food' },
        { id: 3, name: '打印复印', icon: 'print' },
        { id: 4, name: '其他服务', icon: 'other' }
      ],
      message: '获取服务类型成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取版本信息
exports.getVersion = async (req, res, next) => {
  try {
    res.json({
      success: true,
      code: 0,
      data: {
        version: '1.0.0',
        buildNumber: '100',
        releaseDate: '2024-01-01',
        updateLog: '初始版本发布'
      },
      message: '获取版本信息成功'
    });
  } catch (error) {
    next(error);
  }
};

// 检查更新
exports.checkUpdate = async (req, res, next) => {
  try {
    const { version } = req.body;

    res.json({
      success: true,
      code: 0,
      data: {
        hasUpdate: false,
        latestVersion: '1.0.0',
        updateUrl: '',
        forceUpdate: false,
        updateLog: ''
      },
      message: '已是最新版本'
    });
  } catch (error) {
    next(error);
  }
};

// 获取位置信息
exports.getLocation = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.query;

    // 简化版：返回模拟数据
    res.json({
      success: true,
      code: 0,
      data: {
        latitude: latitude || '39.9042',
        longitude: longitude || '116.4074',
        address: '北京市朝阳区',
        city: '北京市',
        district: '朝阳区'
      },
      message: '获取位置信息成功'
    });
  } catch (error) {
    next(error);
  }
};

// 搜索地点
exports.searchLocation = async (req, res, next) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '请提供搜索关键词'
      });
    }

    // 简化版：返回模拟数据
    res.json({
      success: true,
      code: 0,
      data: [
        {
          name: '北京大学',
          address: '北京市海淀区颐和园路5号',
          latitude: '39.9925',
          longitude: '116.3056'
        },
        {
          name: '清华大学',
          address: '北京市海淀区清华园1号',
          latitude: '40.0031',
          longitude: '116.3262'
        }
      ],
      message: '搜索成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取天气信息
exports.getWeather = async (req, res, next) => {
  try {
    const { city } = req.query;

    // 简化版：返回模拟数据
    res.json({
      success: true,
      code: 0,
      data: {
        city: city || '北京',
        temperature: 20,
        weather: '晴',
        humidity: 60,
        windSpeed: 3
      },
      message: '获取天气信息成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取公告列表
exports.getAnnouncements = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;

    res.json({
      success: true,
      code: 0,
      data: {
        list: [
          {
            id: 1,
            title: '系统维护通知',
            content: '系统将于今晚22:00-24:00进行维护',
            type: 'system',
            createdAt: new Date().toISOString()
          }
        ],
        total: 1,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      },
      message: '获取公告列表成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取热门搜索
exports.getHotSearch = async (req, res, next) => {
  try {
    res.json({
      success: true,
      code: 0,
      data: [
        '快递代取',
        '食堂代购',
        '打印复印',
        '图书馆占座',
        '课程代购'
      ],
      message: '获取热门搜索成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取推荐关键词
exports.getRecommendedKeywords = async (req, res, next) => {
  try {
    res.json({
      success: true,
      code: 0,
      data: [
        '快递',
        '外卖',
        '打印',
        '代购',
        '帮忙'
      ],
      message: '获取推荐关键词成功'
    });
  } catch (error) {
    next(error);
  }
};

// 敏感词检查
exports.checkSensitive = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '请提供检查内容'
      });
    }

    // 简化版：简单的敏感词列表
    const sensitiveWords = ['违禁', '非法', '欺诈'];
    const hasSensitive = sensitiveWords.some(word => content.includes(word));

    res.json({
      success: true,
      code: 0,
      data: {
        hasSensitive,
        words: hasSensitive ? sensitiveWords.filter(word => content.includes(word)) : []
      },
      message: hasSensitive ? '包含敏感词' : '内容正常'
    });
  } catch (error) {
    next(error);
  }
};

// 提交意见反馈
exports.submitFeedback = async (req, res, next) => {
  try {
    const { type, content, contact, images } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '请提供反馈内容'
      });
    }

    // 简化版：直接返回成功
    console.log(`用户反馈 - 类型: ${type}, 内容: ${content}`);

    res.json({
      success: true,
      code: 0,
      message: '反馈提交成功，感谢您的建议'
    });
  } catch (error) {
    next(error);
  }
};

// 获取帮助信息
exports.getHelp = async (req, res, next) => {
  try {
    res.json({
      success: true,
      code: 0,
      data: {
        categories: [
          {
            id: 1,
            name: '新手指南',
            items: [
              { title: '如何发布订单', content: '点击首页的发布按钮...' },
              { title: '如何接单', content: '在订单列表中选择订单...' }
            ]
          },
          {
            id: 2,
            name: '常见问题',
            items: [
              { title: '如何取消订单', content: '进入订单详情页...' },
              { title: '如何联系客服', content: '点击我的页面...' }
            ]
          }
        ]
      },
      message: '获取帮助信息成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取关于我们
exports.getAbout = async (req, res, next) => {
  try {
    res.json({
      success: true,
      code: 0,
      data: {
        appName: '校园跑腿',
        version: '1.0.0',
        description: '为校园师生提供便捷的跑腿服务平台',
        company: '校园服务团队',
        contact: 'service@campus.com'
      },
      message: '获取关于我们成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取隐私政策
exports.getPrivacy = async (req, res, next) => {
  try {
    res.json({
      success: true,
      code: 0,
      data: {
        title: '隐私政策',
        content: '我们重视您的隐私保护...',
        updateTime: '2024-01-01'
      },
      message: '获取隐私政策成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取用户协议
exports.getAgreement = async (req, res, next) => {
  try {
    res.json({
      success: true,
      code: 0,
      data: {
        title: '用户协议',
        content: '欢迎使用校园跑腿服务...',
        updateTime: '2024-01-01'
      },
      message: '获取用户协议成功'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
