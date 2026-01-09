// API基础URL
// 如果在本机访问，使用 localhost；如果在其他设备访问，改为服务器IP
const API_BASE_URL = 'http://localhost:3000/api';
let token = localStorage.getItem('adminToken');
let currentPage = 1;
const pageSize = 20;

// 通用API请求函数，自动处理401错误
async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status === 401) {
    alert('登录已过期，请重新登录');
    logout();
    throw new Error('Unauthorized');
  }
  
  return response;
}

// 登录
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('loginError');

  try {
    console.log('尝试登录到:', API_BASE_URL);
    console.log('登录参数:', { username, password: '***' });

    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    console.log('响应状态:', response.status, response.statusText);

    const data = await response.json();
    console.log('响应数据:', data);

    if (data.success) {
      token = data.data.token;
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminInfo', JSON.stringify(data.data.admin));
      showAdminPanel();
    } else {
      errorEl.textContent = data.message || '登录失败';
      errorEl.classList.add('show');
    }
  } catch (error) {
    errorEl.textContent = '网络错误，请稍后重试';
    console.error('登录错误:', error);
  }
});

// 显示管理后台
function showAdminPanel() {
  document.getElementById('loginContainer').style.display = 'none';
  document.getElementById('adminContainer').style.display = 'block';
  
  const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
  document.getElementById('adminName').textContent = adminInfo.name || adminInfo.username;
  
  loadDashboard();
}

// 退出登录
function logout() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminInfo');
  location.reload();
}

// 切换菜单
function switchMenu(menu) {
  document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
  document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
  
  event.target.classList.add('active');
  document.getElementById(menu).classList.add('active');
  
  currentPage = 1;
  
  switch(menu) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'users':
      loadUsers();
      break;
    case 'orders':
      loadOrders();
      break;
    case 'certifications':
      loadCertifications();
      break;
    case 'withdraws':
      loadWithdraws();
      break;
    case 'feedbacks':
      loadFeedbacks();
      break;
  }
}

// 导航到指定页面（从统计卡片点击）
function navigateTo(page) {
  const menuItems = document.querySelectorAll('.menu-item');
  const targetItem = Array.from(menuItems).find(item => item.dataset.page === page);
  
  if (targetItem) {
    targetItem.click();
  } else {
    switchMenu(page);
  }
}

// 导航到订单页面并设置筛选状态
function navigateToOrders(status) {
  navigateTo('orders');
  setTimeout(() => {
    const statusFilter = document.getElementById('orderStatusFilter');
    if (statusFilter) {
      statusFilter.value = status;
      loadOrders(1);
    }
  }, 100);
}

// 加载统计数据
async function loadDashboard() {
  try {
    const response = await apiRequest(`${API_BASE_URL}/admin/statistics`);
    const data = await response.json();
    
    if (data.success) {
      const stats = data.data;
      document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card" onclick="navigateTo('users')" style="cursor: pointer;" title="点击查看用户管理">
          <div class="stat-icon">👥</div>
          <div class="stat-label">总用户数</div>
          <div class="stat-value">${stats.users.total_users}</div>
        </div>
        <div class="stat-card" onclick="navigateTo('certifications')" style="cursor: pointer;" title="点击查看认证审核">
          <div class="stat-icon">✅</div>
          <div class="stat-label">已认证用户</div>
          <div class="stat-value">${stats.users.certified_users}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🆕</div>
          <div class="stat-label">今日新增用户</div>
          <div class="stat-value">${stats.users.today_new_users}</div>
        </div>
        <div class="stat-card" onclick="navigateTo('orders')" style="cursor: pointer;" title="点击查看订单管理">
          <div class="stat-icon">📋</div>
          <div class="stat-label">总订单数</div>
          <div class="stat-value">${stats.orders.total_orders}</div>
        </div>
        <div class="stat-card" onclick="navigateToOrders('pending')" style="cursor: pointer;" title="点击查看待处理订单">
          <div class="stat-icon">⏰</div>
          <div class="stat-label">待处理订单</div>
          <div class="stat-value">${stats.orders.pending_orders}</div>
        </div>
        <div class="stat-card" onclick="navigateToOrders('completed')" style="cursor: pointer;" title="点击查看已完成订单">
          <div class="stat-icon">✓</div>
          <div class="stat-label">已完成订单</div>
          <div class="stat-value">${stats.orders.completed_orders}</div>
        </div>
        <div class="stat-card" onclick="navigateTo('certifications')" style="cursor: pointer;" title="点击查看认证审核">
          <div class="stat-icon">⏳</div>
          <div class="stat-label">待审核认证</div>
          <div class="stat-value">${stats.certifications.pending}</div>
        </div>
        <div class="stat-card" onclick="navigateTo('certifications')" style="cursor: pointer;" title="点击查看认证审核">
          <div class="stat-icon">🏆</div>
          <div class="stat-label">已通过认证</div>
          <div class="stat-value">${stats.certifications.approved}</div>
        </div>
      `;
    }
  } catch (error) {
    console.error('加载统计数据错误:', error);
  }
}

// 加载用户列表
async function loadUsers(page = 1) {
  currentPage = page;
  const keyword = document.getElementById('userSearch')?.value || '';
  const certStatus = document.getElementById('userCertFilter')?.value || '';
  
  try {
    const params = new URLSearchParams({ page, pageSize, keyword, certification_status: certStatus });
    const response = await apiRequest(`${API_BASE_URL}/admin/users?${params}`);
    const data = await response.json();
    
    if (data.success) {
      renderUsersTable(data.data);
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('加载用户列表错误:', error);
    }
  }
}

function renderUsersTable(data) {
  const { list, total, page } = data;
  const totalPages = Math.ceil(total / pageSize);

  if (!list || list.length === 0) {
    document.getElementById('usersTable').innerHTML = `
      <div style="text-align: center; padding: 60px; color: #999;">
        <div style="font-size: 64px; margin-bottom: 20px;">📭</div>
        <div style="font-size: 18px; margin-bottom: 10px;">暂无用户数据</div>
        <div style="font-size: 14px; color: #bbb;">还没有用户注册哦~</div>
      </div>
    `;
    return;
  }
  
  let html = `
    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>用户名</th>
          <th>昵称</th>
          <th>手机号</th>
          <th>学号</th>
          <th>认证状态</th>
          <th>余额</th>
          <th>注册时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  list.forEach(user => {
    html += `
      <tr>
        <td><strong>#${user.id}</strong></td>
        <td>${user.username || '-'}</td>
        <td>${user.nickname || '-'}</td>
        <td>${user.phone || '-'}</td>
        <td>${user.student_id || '-'}</td>
        <td>${user.is_certified ? '<span class="status-badge status-approved">✓ 已认证</span>' : '<span class="status-badge status-pending">○ 未认证</span>'}</td>
        <td><strong style="color: #667eea;">¥${user.balance || 0}</strong></td>
        <td style="font-size: 13px; color: #999;">${new Date(user.created_at).toLocaleString()}</td>
        <td>
          <button class="btn btn-primary" onclick="viewUser(${user.id})">👁 查看</button>
          <button class="btn btn-danger" onclick="deleteUser(${user.id})">🗑 删除</button>
        </td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
    <div class="pagination">
      <button onclick="loadUsers(${page - 1})" ${page <= 1 ? 'disabled' : ''}>⬅ 上一页</button>
      <span>📄 第 ${page} / ${totalPages} 页，共 ${total} 条</span>
      <button onclick="loadUsers(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>下一页 ➡</button>
    </div>
  `;
  
  document.getElementById('usersTable').innerHTML = html;
}

function searchUsers() {
  loadUsers(1);
}

async function deleteUser(id) {
  if (!confirm('确定要删除该用户吗？')) return;
  
  try {
    const response = await apiRequest(`${API_BASE_URL}/admin/users/${id}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    
    if (data.success) {
      alert('删除成功');
      loadUsers(currentPage);
    } else {
      alert(data.message || '删除失败');
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      alert('删除失败');
      console.error('删除用户错误:', error);
    }
  }
}

// 加载订单列表
async function loadOrders(page = 1) {
  currentPage = page;
  const keyword = document.getElementById('orderSearch')?.value || '';
  const status = document.getElementById('orderStatusFilter')?.value || '';
  
  try {
    const params = new URLSearchParams({ page, pageSize, keyword, status });
    const response = await apiRequest(`${API_BASE_URL}/admin/orders?${params}`);
    const data = await response.json();
    
    if (data.success) {
      renderOrdersTable(data.data);
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('加载订单列表错误:', error);
    }
  }
}

function renderOrdersTable(data) {
  const { list, total, page } = data;
  const totalPages = Math.ceil(total / pageSize);

  if (!list || list.length === 0) {
    document.getElementById('ordersTable').innerHTML = `
      <div style="text-align: center; padding: 60px; color: #999;">
        <div style="font-size: 64px; margin-bottom: 20px;">📋</div>
        <div style="font-size: 18px; margin-bottom: 10px;">暂无订单数据</div>
        <div style="font-size: 14px; color: #bbb;">还没有订单哦~</div>
      </div>
    `;
    return;
  }
  
  const statusMap = {
    'pending': '⏰ 待接单',
    'accepted': '✅ 已接单',
    'in_progress': '🔄 进行中',
    'completed': '✓ 已完成',
    'cancelled': '✗ 已取消'
  };
  
  let html = `
    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>标题</th>
          <th>发布者</th>
          <th>接单者</th>
          <th>金额</th>
          <th>状态</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  list.forEach(order => {
    html += `
      <tr>
        <td><strong>#${order.id}</strong></td>
        <td><strong>${order.title}</strong></td>
        <td>${order.publisher_name || '-'}</td>
        <td>${order.acceptor_name || '-'}</td>
        <td><strong style="color: #43e97b; font-size: 16px;">¥${order.price}</strong></td>
        <td><span class="status-badge status-${order.status}">${statusMap[order.status] || order.status}</span></td>
        <td style="font-size: 13px; color: #999;">${new Date(order.created_at).toLocaleString()}</td>
        <td>
          <button class="btn btn-primary" onclick="viewOrder(${order.id})">👁 查看</button>
          <button class="btn btn-danger" onclick="deleteOrder(${order.id})">🗑 删除</button>
        </td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
    <div class="pagination">
      <button onclick="loadOrders(${page - 1})" ${page <= 1 ? 'disabled' : ''}>⬅ 上一页</button>
      <span>📄 第 ${page} / ${totalPages} 页，共 ${total} 条</span>
      <button onclick="loadOrders(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>下一页 ➡</button>
    </div>
  `;
  
  document.getElementById('ordersTable').innerHTML = html;
}

function searchOrders() {
  loadOrders(1);
}

async function deleteOrder(id) {
  if (!confirm('确定要删除该订单吗？')) return;

  try {
    const response = await apiRequest(`${API_BASE_URL}/admin/orders/${id}`, {
      method: 'DELETE'
    });
    const data = await response.json();

    if (data.success) {
      alert('删除成功');
      loadOrders(currentPage);
    } else {
      alert(data.message || '删除失败');
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      alert('删除失败');
      console.error('删除订单错误:', error);
    }
  }
}

// 查看订单详情
async function viewOrder(id) {
  try {
    const response = await apiRequest(`${API_BASE_URL}/admin/orders?page=1&pageSize=100`);
    const data = await response.json();

    if (data.success) {
      const order = data.data.list.find(o => o.id === id);
      if (order) {
        showOrderDetail(order);
      }
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('查看订单详情错误:', error);
      alert('加载订单详情失败');
    }
  }
}

function showOrderDetail(order) {
  const statusMap = {
    'pending': '⏰ 待接单',
    'accepted': '✅ 已接单',
    'in_progress': '🔄 进行中',
    'completed': '✓ 已完成',
    'cancelled': '✗ 已取消'
  };

  const typeMap = {
    'delivery': '📦 快递代取',
    'errand': '🏃 跑腿代办',
    'buy': '🛒 代买物品'
  };

  let html = `
    <div style="line-height: 2.2; color: #555;">
      <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <h4 style="margin-bottom: 15px; color: #667eea; display: flex; align-items: center; gap: 8px;">
          <span>📋</span> 订单信息
        </h4>
        <p><strong>订单ID：</strong>#${order.id}</p>
        <p><strong>订单类型：</strong>${typeMap[order.type] || order.type}</p>
        <p><strong>订单标题：</strong><span style="color: #667eea; font-weight: 600;">${order.title}</span></p>
        <p><strong>订单金额：</strong><strong style="color: #43e97b; font-size: 18px;">¥${order.price}</strong></p>
        <p><strong>订单状态：</strong><span class="status-badge status-${order.status}">${statusMap[order.status] || order.status}</span></p>
      </div>

      <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <h4 style="margin-bottom: 15px; color: #667eea; display: flex; align-items: center; gap: 8px;">
          <span>👤</span> 发布者信息
        </h4>
        <p><strong>用户ID：</strong>#${order.publisher_id}</p>
        <p><strong>用户名：</strong>${order.publisher_name || '-'}</p>
        <p><strong>联系方式：</strong>${order.publisher_phone || '-'}</p>
      </div>

      <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <h4 style="margin-bottom: 15px; color: #667eea; display: flex; align-items: center; gap: 8px;">
          <span>🏃</span> 接单者信息
        </h4>
        <p><strong>用户ID：</strong>${order.acceptor_id ? '#' + order.acceptor_id : '-'}</p>
        <p><strong>用户名：</strong>${order.acceptor_name || '-'}</p>
        <p><strong>联系方式：</strong>${order.acceptor_phone || '-'}</p>
      </div>

      <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <h4 style="margin-bottom: 15px; color: #667eea; display: flex; align-items: center; gap: 8px;">
          <span>📝</span> 订单描述
        </h4>
        <p style="color: #666; line-height: 1.8;">${order.description || '-'}</p>
      </div>

      <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <h4 style="margin-bottom: 15px; color: #667eea; display: flex; align-items: center; gap: 8px;">
          <span>📅</span> 时间信息
        </h4>
        <p><strong>创建时间：</strong>${new Date(order.created_at).toLocaleString()}</p>
        <p><strong>接单时间：</strong>${order.accepted_at ? new Date(order.accepted_at).toLocaleString() : '-'}</p>
        <p><strong>完成时间：</strong>${order.completed_at ? new Date(order.completed_at).toLocaleString() : '-'}</p>
      </div>
    </div>
  `;

  document.getElementById('orderDetail').innerHTML = html;
  document.getElementById('orderModal').classList.add('active');
}

function closeOrderModal() {
  document.getElementById('orderModal').classList.remove('active');
}

// 查看用户详情
async function viewUser(id) {
  try {
    const response = await apiRequest(`${API_BASE_URL}/admin/users?page=1&pageSize=100`);
    const data = await response.json();

    if (data.success) {
      const user = data.data.list.find(u => u.id === id);
      if (user) {
        showUserDetail(user);
      }
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('查看用户详情错误:', error);
      alert('加载用户详情失败');
    }
  }
}

function showUserDetail(user) {
  let html = `
    <div style="line-height: 2.2; color: #555;">
      <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <h4 style="margin-bottom: 15px; color: #667eea; display: flex; align-items: center; gap: 8px;">
          <span>👤</span> 基本信息
        </h4>
        <p><strong>用户ID：</strong>#${user.id}</p>
        <p><strong>用户名：</strong>${user.username || '-'}</p>
        <p><strong>昵称：</strong><span style="color: #667eea; font-weight: 600;">${user.nickname || '-'}</span></p>
        <p><strong>手机号：</strong>${user.phone || '-'}</p>
        <p><strong>邮箱：</strong>${user.email || '-'}</p>
      </div>

      <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <h4 style="margin-bottom: 15px; color: #667eea; display: flex; align-items: center; gap: 8px;">
          <span>🎓</span> 学籍信息
        </h4>
        <p><strong>学号：</strong><span style="color: #667eea; font-weight: 600;">${user.student_id || '-'}</span></p>
        <p><strong>学校：</strong>${user.school || '-'}</p>
        <p><strong>学院：</strong>${user.college || '-'}</p>
        <p><strong>专业：</strong>${user.major || '-'}</p>
        <p><strong>年级：</strong>${user.grade || '-'}</p>
      </div>

      <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <h4 style="margin-bottom: 15px; color: #667eea; display: flex; align-items: center; gap: 8px;">
          <span>💰</span> 账户信息
        </h4>
        <p><strong>余额：</strong><strong style="color: #667eea; font-size: 18px;">¥${user.balance || 0}</strong></p>
        <p><strong>认证状态：</strong>${user.is_certified ? '<span class="status-badge status-approved">✓ 已认证</span>' : '<span class="status-badge status-pending">○ 未认证</span>'}</p>
      </div>

      <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <h4 style="margin-bottom: 15px; color: #667eea; display: flex; align-items: center; gap: 8px;">
          <span>📅</span> 账户信息
        </h4>
        <p><strong>注册时间：</strong>${new Date(user.created_at).toLocaleString()}</p>
        <p><strong>最后登录：</strong>${user.last_login ? new Date(user.last_login).toLocaleString() : '-'}</p>
        <p><strong>状态：</strong>${user.is_active ? '<span class="status-badge status-approved">✓ 正常</span>' : '<span class="status-badge status-cancelled">✗ 已禁用</span>'}</p>
      </div>
    </div>
  `;

  document.getElementById('userDetail').innerHTML = html;
  document.getElementById('userModal').classList.add('active');
}

function closeUserModal() {
  document.getElementById('userModal').classList.remove('active');
}

// 加载认证列表
async function loadCertifications(page = 1) {
  currentPage = page;
  const keyword = document.getElementById('certSearch')?.value || '';
  const status = document.getElementById('certStatusFilter')?.value || '';
  
  try {
    const params = new URLSearchParams({ page, pageSize, keyword, status });
    const response = await apiRequest(`${API_BASE_URL}/admin/certifications?${params}`);
    const data = await response.json();
    
    if (data.success) {
      renderCertificationsTable(data.data);
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('加载认证列表错误:', error);
    }
  }
}

function renderCertificationsTable(data) {
  const { list, total, page } = data;
  const totalPages = Math.ceil(total / pageSize);

  if (!list || list.length === 0) {
    document.getElementById('certificationsTable').innerHTML = `
      <div style="text-align: center; padding: 60px; color: #999;">
        <div style="font-size: 64px; margin-bottom: 20px;">🏍️</div>
        <div style="font-size: 18px; margin-bottom: 10px;">暂无骑手认证申请</div>
        <div style="font-size: 14px; color: #bbb;">还没有骑手认证申请哦~</div>
      </div>
    `;
    return;
  }

  const statusMap = {
    'pending': '⏰ 待审核',
    'approved': '✓ 已通过',
    'rejected': '✗ 已拒绝'
  };

  let html = `
    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>用户</th>
          <th>真实姓名</th>
          <th>联系电话</th>
          <th>身份证号</th>
          <th>状态</th>
          <th>提交时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
  `;

  list.forEach(cert => {
    html += `
      <tr>
        <td><strong>#${cert.id}</strong></td>
        <td><strong>${cert.nickname || cert.username}</strong></td>
        <td>${cert.real_name}</td>
        <td>${cert.phone || '-'}</td>
        <td>${cert.id_card ? cert.id_card.replace(/(\d{6})\d{8}(\d{4})/, '$1****$2') : '-'}</td>
        <td><span class="status-badge status-${cert.status}">${statusMap[cert.status] || cert.status}</span></td>
        <td style="font-size: 13px; color: #999;">${new Date(cert.submitted_at).toLocaleString()}</td>
        <td>
          <button class="btn btn-primary" onclick="viewCertification(${cert.id})">👁 详情</button>
          ${cert.status === 'pending' ? `
            <button class="btn btn-success" onclick="approveCertification(${cert.id})">✓ 通过</button>
            <button class="btn btn-danger" onclick="rejectCertification(${cert.id})">✗ 拒绝</button>
          ` : ''}
        </td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
    <div class="pagination">
      <button onclick="loadCertifications(${page - 1})" ${page <= 1 ? 'disabled' : ''}>⬅ 上一页</button>
      <span>📄 第 ${page} / ${totalPages} 页，共 ${total} 条</span>
      <button onclick="loadCertifications(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>下一页 ➡</button>
    </div>
  `;

  document.getElementById('certificationsTable').innerHTML = html;
}

function searchCertifications() {
  loadCertifications(1);
}

function resetCertFilters() {
  document.getElementById('certSearch').value = '';
  document.getElementById('certStatusFilter').value = '';
  loadCertifications(1);
}

async function viewCertification(id) {
  try {
    const response = await apiRequest(`${API_BASE_URL}/admin/certifications?page=1&pageSize=100`);
    const data = await response.json();
    
    if (data.success) {
      const cert = data.data.list.find(c => c.id === id);
      if (cert) {
        showCertificationDetail(cert);
      }
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('查看认证详情错误:', error);
    }
  }
}

function showCertificationDetail(cert) {
  let html = `
    <div style="line-height: 2.2; color: #555;">
      <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <h4 style="margin-bottom: 15px; color: #667eea; display: flex; align-items: center; gap: 8px;">
          <span>🏍️</span> 骑手基本信息
        </h4>
        <p><strong>真实姓名：</strong><span style="color: #667eea; font-weight: 600;">${cert.real_name}</span></p>
        <p><strong>身份证号：</strong>${cert.id_card}</p>
        <p><strong>联系电话：</strong>${cert.phone || '-'}</p>
      </div>

      <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <h4 style="margin-bottom: 15px; color: #667eea; display: flex; align-items: center; gap: 8px;">
          <span>📞</span> 紧急联系人
        </h4>
        <p><strong>联系人姓名：</strong>${cert.emergency_contact || '-'}</p>
        <p><strong>联系人电话：</strong>${cert.emergency_phone || '-'}</p>
      </div>

      <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <h4 style="margin-bottom: 15px; color: #667eea; display: flex; align-items: center; gap: 8px;">
          <span>📅</span> 提交时间
        </h4>
        <p>${new Date(cert.submitted_at).toLocaleString()}</p>
      </div>
  `;

  if (cert.id_card_front) {
    html += `
      <div style="margin: 20px 0;">
        <h4 style="margin-bottom: 10px; color: #667eea; display: flex; align-items: center; gap: 8px;">
          <span>🆔</span> 身份证正面（人像面）
        </h4>
        <img src="${API_BASE_URL.replace('/api', '')}${cert.id_card_front}" class="cert-image" style="cursor: zoom-in;">
      </div>`;
  }
  if (cert.id_card_back) {
    html += `
      <div style="margin: 20px 0;">
        <h4 style="margin-bottom: 10px; color: #667eea; display: flex; align-items: center; gap: 8px;">
          <span>🆔</span> 身份证背面（国徽面）
        </h4>
        <img src="${API_BASE_URL.replace('/api', '')}${cert.id_card_back}" class="cert-image" style="cursor: zoom-in;">
      </div>`;
  }
  if (cert.health_cert) {
    html += `
      <div style="margin: 20px 0;">
        <h4 style="margin-bottom: 10px; color: #667eea; display: flex; align-items: center; gap: 8px;">
          <span>🏥</span> 健康证
        </h4>
        <img src="${API_BASE_URL.replace('/api', '')}${cert.health_cert}" class="cert-image" style="cursor: zoom-in;">
      </div>`;
  }

  if (cert.status === 'rejected' && cert.reject_reason) {
    html += `
      <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 20px; border-radius: 12px; margin-top: 20px; border-left: 4px solid #f59e0b;">
        <h4 style="margin-bottom: 10px; color: #d97706; display: flex; align-items: center; gap: 8px;">
          <span>⚠️</span> 拒绝原因
        </h4>
        <p style="color: #92400e;">${cert.reject_reason}</p>
      </div>`;
  }

  html += '</div>';

  document.getElementById('certDetail').innerHTML = html;
  document.getElementById('certModal').classList.add('active');
}

function closeCertModal() {
  document.getElementById('certModal').classList.remove('active');
}

async function approveCertification(id) {
  if (!confirm('确定通过该认证申请吗？')) return;
  
  try {
    const response = await apiRequest(`${API_BASE_URL}/admin/certifications/${id}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'approved' })
    });
    const data = await response.json();
    
    if (data.success) {
      alert('审核通过');
      loadCertifications(currentPage);
    } else {
      alert(data.message || '审核失败');
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      alert('审核失败');
      console.error('审核认证错误:', error);
    }
  }
}

async function rejectCertification(id) {
  const reason = prompt('请输入拒绝原因：');
  if (!reason) return;
  
  try {
    const response = await apiRequest(`${API_BASE_URL}/admin/certifications/${id}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'rejected', reject_reason: reason })
    });
    const data = await response.json();
    
    if (data.success) {
      alert('已拒绝');
      loadCertifications(currentPage);
    } else {
      alert(data.message || '操作失败');
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      alert('操作失败');
      console.error('审核认证错误:', error);
    }
  }
}

// 页面加载时检查登录状态
window.addEventListener('DOMContentLoaded', () => {
  if (token) {
    showAdminPanel();
  }
});


// ==================== 提现管理 ====================

// 加载提现列表
async function loadWithdraws(page = 1) {
  currentPage = page;
  const status = document.getElementById('withdrawStatusFilter')?.value || '';

  try {
    const params = new URLSearchParams({
      page,
      pageSize,
      ...(status && { status })
    });

    const response = await apiRequest(`${API_BASE_URL}/admin/withdraws?${params}`);
    const data = await response.json();

    if (data.success) {
      displayWithdraws(data.data);
    } else {
      alert(data.message || '加载失败');
    }
  } catch (error) {
    console.error('加载提现列表错误:', error);
    alert('加载失败');
  }
}

// 显示提现列表
function displayWithdraws(data) {
  const { list, total, page } = data;
  const totalPages = Math.ceil(total / pageSize);

  const statusMap = {
    pending: { text: '待审核', color: '#f59e0b', icon: '⏳' },
    approved: { text: '已通过', color: '#10b981', icon: '✅' },
    rejected: { text: '已拒绝', color: '#ef4444', icon: '❌' }
  };

  document.getElementById('withdraws').innerHTML = `
    <div class="section-header">
      <h2>💰 提现管理</h2>
      <div class="filters">
        <select id="withdrawStatusFilter" onchange="loadWithdraws(1)">
          <option value="">全部状态</option>
          <option value="pending">待审核</option>
          <option value="approved">已通过</option>
          <option value="rejected">已拒绝</option>
        </select>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>用户</th>
          <th>提现金额</th>
          <th>账户信息</th>
          <th>状态</th>
          <th>申请时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${list.map(w => {
          const status = statusMap[w.status] || { text: w.status, color: '#6b7280', icon: '❓' };
          return `
            <tr>
              <td>${w.id}</td>
              <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <img src="${w.avatar || '/images/default-avatar.png'}" style="width: 32px; height: 32px; border-radius: 50%;">
                  <div>
                    <div>${w.nickname || w.username}</div>
                    <div style="font-size: 12px; color: #6b7280;">${w.phone || '-'}</div>
                  </div>
                </div>
              </td>
              <td style="color: #ef4444; font-weight: bold;">¥${parseFloat(w.amount).toFixed(2)}</td>
              <td>
                <div>${w.account_type === 'wechat' ? '微信' : w.account_type === 'alipay' ? '支付宝' : '银行卡'}</div>
                <div style="font-size: 12px; color: #6b7280;">${w.account}</div>
              </td>
              <td>
                <span style="background: ${status.color}20; color: ${status.color}; padding: 4px 12px; border-radius: 12px; font-size: 12px;">
                  ${status.icon} ${status.text}
                </span>
              </td>
              <td>${new Date(w.created_at).toLocaleString()}</td>
              <td>
                ${w.status === 'pending' ? `
                  <button class="btn btn-success" onclick="approveWithdraw(${w.id})">✅ 通过</button>
                  <button class="btn btn-danger" onclick="rejectWithdraw(${w.id})">❌ 拒绝</button>
                ` : `
                  <button class="btn btn-primary" onclick="viewWithdrawDetail(${w.id})">👁️ 查看</button>
                `}
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
    <div class="pagination">
      <button onclick="loadWithdraws(${page - 1})" ${page <= 1 ? 'disabled' : ''}>⬅ 上一页</button>
      <span>📄 第 ${page} / ${totalPages} 页，共 ${total} 条</span>
      <button onclick="loadWithdraws(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>下一页 ➡</button>
    </div>
  `;
}

// 通过提现申请
async function approveWithdraw(id) {
  if (!confirm('确认通过此提现申请？\n\n请确保已将款项转账至用户账户。')) return;

  try {
    const response = await apiRequest(`${API_BASE_URL}/admin/withdraws/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' })
    });

    const data = await response.json();
    if (data.success) {
      alert('✅ 审核通过');
      loadWithdraws(currentPage);
    } else {
      alert(data.message || '操作失败');
    }
  } catch (error) {
    console.error('审核错误:', error);
    alert('操作失败');
  }
}

// 拒绝提现申请
async function rejectWithdraw(id) {
  const reason = prompt('请输入拒绝原因：');
  if (!reason) return;

  try {
    const response = await apiRequest(`${API_BASE_URL}/admin/withdraws/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected', reject_reason: reason })
    });

    const data = await response.json();
    if (data.success) {
      alert('❌ 已拒绝');
      loadWithdraws(currentPage);
    } else {
      alert(data.message || '操作失败');
    }
  } catch (error) {
    console.error('审核错误:', error);
    alert('操作失败');
  }
}

// 查看提现详情
async function viewWithdrawDetail(id) {
  alert('提现详情功能待实现');
}

// ==================== 意见反馈管理 ====================

// 加载反馈列表
async function loadFeedbacks(page = 1) {
  currentPage = page;
  const keyword = document.getElementById('feedbackSearch')?.value || '';
  const status = document.getElementById('feedbackStatusFilter')?.value || '';
  const type = document.getElementById('feedbackTypeFilter')?.value || '';

  try {
    const params = new URLSearchParams({ page, pageSize, keyword, status, type });
    const response = await apiRequest(`${API_BASE_URL}/admin/feedbacks?${params}`);
    const data = await response.json();

    if (data.success) {
      renderFeedbacksTable(data.data);
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('加载反馈列表错误:', error);
    }
  }
}

// 渲染反馈列表
function renderFeedbacksTable(data) {
  const { list, total, page } = data;
  const totalPages = Math.ceil(total / pageSize);

  if (!list || list.length === 0) {
    document.getElementById('feedbacksTable').innerHTML = `
      <div style="text-align: center; padding: 60px; color: #999;">
        <div style="font-size: 64px; margin-bottom: 20px;">💬</div>
        <div style="font-size: 18px; margin-bottom: 10px;">暂无反馈数据</div>
        <div style="font-size: 14px; color: #bbb;">还没有用户提交反馈哦~</div>
      </div>
    `;
    return;
  }

  const statusMap = {
    'pending': { text: '待处理', class: 'status-pending', icon: '⏳' },
    'processing': { text: '处理中', class: 'status-pending', icon: '🔄' },
    'resolved': { text: '已解决', class: 'status-approved', icon: '✅' },
    'closed': { text: '已关闭', class: 'status-rejected', icon: '🔒' }
  };

  const typeMap = {
    'bug': { text: 'Bug反馈', icon: '🐛' },
    'feature': { text: '功能建议', icon: '💡' },
    'complaint': { text: '投诉建议', icon: '⚠️' },
    'other': { text: '其他问题', icon: '❓' }
  };

  let html = `
    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>用户</th>
          <th>类型</th>
          <th>标题</th>
          <th>状态</th>
          <th>提交时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
  `;

  list.forEach(feedback => {
    const statusInfo = statusMap[feedback.status] || statusMap['pending'];
    const typeInfo = typeMap[feedback.type] || typeMap['other'];

    html += `
      <tr>
        <td><strong>#${feedback.id}</strong></td>
        <td>${feedback.nickname || feedback.username || '用户' + feedback.user_id}</td>
        <td>${typeInfo.icon} ${typeInfo.text}</td>
        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${feedback.title}</td>
        <td><span class="status-badge ${statusInfo.class}">${statusInfo.icon} ${statusInfo.text}</span></td>
        <td style="font-size: 13px; color: #999;">${new Date(feedback.created_at).toLocaleString()}</td>
        <td>
          <button class="btn btn-primary" onclick="viewFeedback(${feedback.id})">👁 查看</button>
          ${feedback.status === 'pending' || feedback.status === 'processing' ? `
            <button class="btn btn-success" onclick="replyFeedback(${feedback.id})">💬 回复</button>
          ` : ''}
        </td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
    <div class="pagination">
      <button onclick="loadFeedbacks(${page - 1})" ${page <= 1 ? 'disabled' : ''}>⬅ 上一页</button>
      <span>📄 第 ${page} / ${totalPages} 页，共 ${total} 条</span>
      <button onclick="loadFeedbacks(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>下一页 ➡</button>
    </div>
  `;

  document.getElementById('feedbacksTable').innerHTML = html;
}

// 搜索反馈
function searchFeedbacks() {
  loadFeedbacks(1);
}

// 查看反馈详情
async function viewFeedback(id) {
  try {
    const response = await apiRequest(`${API_BASE_URL}/admin/feedbacks?page=1&pageSize=100`);
    const data = await response.json();

    if (data.success) {
      const feedback = data.data.list.find(f => f.id === id);
      if (feedback) {
        showFeedbackDetail(feedback);
      }
    }
  } catch (error) {
    console.error('查看反馈详情错误:', error);
    alert('加载反馈详情失败');
  }
}

// 显示反馈详情
function showFeedbackDetail(feedback) {
  const statusMap = {
    'pending': '⏳ 待处理',
    'processing': '🔄 处理中',
    'resolved': '✅ 已解决',
    'closed': '🔒 已关闭'
  };

  const typeMap = {
    'bug': '🐛 Bug反馈',
    'feature': '💡 功能建议',
    'complaint': '⚠️ 投诉建议',
    'other': '❓ 其他问题'
  };

  let html = `
    <div style="line-height: 2.2; color: #555;">
      <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <h4 style="margin-bottom: 15px; color: #667eea; display: flex; align-items: center; gap: 8px;">
          <span>📋</span> 反馈信息
        </h4>
        <p><strong>反馈ID：</strong>#${feedback.id}</p>
        <p><strong>反馈类型：</strong>${typeMap[feedback.type] || feedback.type}</p>
        <p><strong>反馈标题：</strong><span style="color: #667eea; font-weight: 600;">${feedback.title}</span></p>
        <p><strong>状态：</strong>${statusMap[feedback.status] || feedback.status}</p>
      </div>

      <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <h4 style="margin-bottom: 15px; color: #667eea; display: flex; align-items: center; gap: 8px;">
          <span>👤</span> 用户信息
        </h4>
        <p><strong>用户ID：</strong>#${feedback.user_id}</p>
        <p><strong>用户名：</strong>${feedback.nickname || feedback.username || '-'}</p>
        <p><strong>联系方式：</strong>${feedback.contact || '未提供'}</p>
      </div>

      <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <h4 style="margin-bottom: 15px; color: #667eea; display: flex; align-items: center; gap: 8px;">
          <span>📝</span> 反馈内容
        </h4>
        <p style="color: #666; line-height: 1.8; white-space: pre-wrap;">${feedback.content}</p>
      </div>
  `;

  // 显示图片
  if (feedback.images && feedback.images.length > 0) {
    html += `
      <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <h4 style="margin-bottom: 15px; color: #667eea; display: flex; align-items: center; gap: 8px;">
          <span>🖼️</span> 相关图片
        </h4>
        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
    `;
    feedback.images.forEach(img => {
      html += `<img src="${API_BASE_URL.replace('/api', '')}${img}" class="cert-image" style="max-width: 150px; cursor: zoom-in;">`;
    });
    html += `</div></div>`;
  }

  // 显示回复
  if (feedback.reply) {
    html += `
      <div style="background: linear-gradient(135deg, #d1fae5, #a7f3d0); padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #10b981;">
        <h4 style="margin-bottom: 15px; color: #065f46; display: flex; align-items: center; gap: 8px;">
          <span>💬</span> 管理员回复
        </h4>
        <p style="color: #065f46; line-height: 1.8; white-space: pre-wrap;">${feedback.reply}</p>
        <p style="font-size: 12px; color: #059669; margin-top: 10px;">回复时间：${feedback.replied_at ? new Date(feedback.replied_at).toLocaleString() : '-'}</p>
      </div>
    `;
  }

  html += `
      <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 12px;">
        <h4 style="margin-bottom: 15px; color: #667eea; display: flex; align-items: center; gap: 8px;">
          <span>📅</span> 时间信息
        </h4>
        <p><strong>提交时间：</strong>${new Date(feedback.created_at).toLocaleString()}</p>
      </div>
    </div>
  `;

  document.getElementById('feedbackDetail').innerHTML = html;
  document.getElementById('feedbackModal').classList.add('active');
}

// 关闭反馈模态框
function closeFeedbackModal() {
  document.getElementById('feedbackModal').classList.remove('active');
}

// 回复反馈
async function replyFeedback(id) {
  const reply = prompt('请输入回复内容：');
  if (!reply || !reply.trim()) return;

  try {
    const response = await apiRequest(`${API_BASE_URL}/admin/feedbacks/${id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: reply.trim(), status: 'resolved' })
    });

    const data = await response.json();
    if (data.success) {
      alert('✅ 回复成功');
      loadFeedbacks(currentPage);
    } else {
      alert(data.message || '回复失败');
    }
  } catch (error) {
    console.error('回复反馈错误:', error);
    alert('回复失败');
  }
}
