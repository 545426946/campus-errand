// API基础URL
const API_BASE_URL = 'http://localhost:3000/api';
let token = localStorage.getItem('adminToken');
let currentPage = 1;
const pageSize = 20;

// 登录
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('loginError');

  try {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (data.success) {
      token = data.data.token;
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminInfo', JSON.stringify(data.data.admin));
      showAdminPanel();
    } else {
      errorEl.textContent = data.message || '登录失败';
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
  }
}

// 加载统计数据
async function loadDashboard() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/statistics`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (data.success) {
      const stats = data.data;
      document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card">
          <div class="stat-label">总用户数</div>
          <div class="stat-value">${stats.users.total_users}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">已认证用户</div>
          <div class="stat-value">${stats.users.certified_users}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">今日新增用户</div>
          <div class="stat-value">${stats.users.today_new_users}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">总订单数</div>
          <div class="stat-value">${stats.orders.total_orders}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">待处理订单</div>
          <div class="stat-value">${stats.orders.pending_orders}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">已完成订单</div>
          <div class="stat-value">${stats.orders.completed_orders}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">待审核认证</div>
          <div class="stat-value">${stats.certifications.pending}</div>
        </div>
        <div class="stat-card">
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
    const response = await fetch(`${API_BASE_URL}/admin/users?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (data.success) {
      renderUsersTable(data.data);
    }
  } catch (error) {
    console.error('加载用户列表错误:', error);
  }
}

function renderUsersTable(data) {
  const { list, total, page } = data;
  const totalPages = Math.ceil(total / pageSize);
  
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
        <td>${user.id}</td>
        <td>${user.username || '-'}</td>
        <td>${user.nickname || '-'}</td>
        <td>${user.phone || '-'}</td>
        <td>${user.student_id || '-'}</td>
        <td>${user.is_certified ? '<span class="status-badge status-approved">已认证</span>' : '<span class="status-badge status-pending">未认证</span>'}</td>
        <td>¥${user.balance || 0}</td>
        <td>${new Date(user.created_at).toLocaleString()}</td>
        <td>
          <button class="btn btn-primary" onclick="viewUser(${user.id})">查看</button>
          <button class="btn btn-danger" onclick="deleteUser(${user.id})">删除</button>
        </td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
    <div class="pagination">
      <button onclick="loadUsers(${page - 1})" ${page <= 1 ? 'disabled' : ''}>上一页</button>
      <span>第 ${page} / ${totalPages} 页，共 ${total} 条</span>
      <button onclick="loadUsers(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>下一页</button>
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
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (data.success) {
      alert('删除成功');
      loadUsers(currentPage);
    } else {
      alert(data.message || '删除失败');
    }
  } catch (error) {
    alert('删除失败');
    console.error('删除用户错误:', error);
  }
}

// 加载订单列表
async function loadOrders(page = 1) {
  currentPage = page;
  const keyword = document.getElementById('orderSearch')?.value || '';
  const status = document.getElementById('orderStatusFilter')?.value || '';
  
  try {
    const params = new URLSearchParams({ page, pageSize, keyword, status });
    const response = await fetch(`${API_BASE_URL}/admin/orders?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (data.success) {
      renderOrdersTable(data.data);
    }
  } catch (error) {
    console.error('加载订单列表错误:', error);
  }
}

function renderOrdersTable(data) {
  const { list, total, page } = data;
  const totalPages = Math.ceil(total / pageSize);
  
  const statusMap = {
    'pending': '待接单',
    'accepted': '已接单',
    'in_progress': '进行中',
    'completed': '已完成',
    'cancelled': '已取消'
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
        <td>${order.id}</td>
        <td>${order.title}</td>
        <td>${order.publisher_name || '-'}</td>
        <td>${order.receiver_name || '-'}</td>
        <td>¥${order.price}</td>
        <td><span class="status-badge status-${order.status}">${statusMap[order.status] || order.status}</span></td>
        <td>${new Date(order.created_at).toLocaleString()}</td>
        <td>
          <button class="btn btn-primary" onclick="viewOrder(${order.id})">查看</button>
          <button class="btn btn-danger" onclick="deleteOrder(${order.id})">删除</button>
        </td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
    <div class="pagination">
      <button onclick="loadOrders(${page - 1})" ${page <= 1 ? 'disabled' : ''}>上一页</button>
      <span>第 ${page} / ${totalPages} 页，共 ${total} 条</span>
      <button onclick="loadOrders(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>下一页</button>
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
    const response = await fetch(`${API_BASE_URL}/admin/orders/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (data.success) {
      alert('删除成功');
      loadOrders(currentPage);
    } else {
      alert(data.message || '删除失败');
    }
  } catch (error) {
    alert('删除失败');
    console.error('删除订单错误:', error);
  }
}

// 加载认证列表
async function loadCertifications(page = 1) {
  currentPage = page;
  const status = document.getElementById('certStatusFilter')?.value || '';
  
  try {
    const params = new URLSearchParams({ page, pageSize, status });
    const response = await fetch(`${API_BASE_URL}/admin/certifications?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (data.success) {
      renderCertificationsTable(data.data);
    }
  } catch (error) {
    console.error('加载认证列表错误:', error);
  }
}

function renderCertificationsTable(data) {
  const { list, total, page } = data;
  const totalPages = Math.ceil(total / pageSize);
  
  const statusMap = {
    'pending': '待审核',
    'approved': '已通过',
    'rejected': '已拒绝'
  };
  
  const typeMap = {
    'student': '学生认证',
    'teacher': '教师认证'
  };
  
  let html = `
    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>用户</th>
          <th>认证类型</th>
          <th>真实姓名</th>
          <th>学号/工号</th>
          <th>学校</th>
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
        <td>${cert.id}</td>
        <td>${cert.nickname || cert.username}</td>
        <td>${typeMap[cert.type] || cert.type}</td>
        <td>${cert.real_name}</td>
        <td>${cert.student_id || '-'}</td>
        <td>${cert.school}</td>
        <td><span class="status-badge status-${cert.status}">${statusMap[cert.status] || cert.status}</span></td>
        <td>${new Date(cert.submitted_at).toLocaleString()}</td>
        <td>
          <button class="btn btn-primary" onclick="viewCertification(${cert.id})">查看详情</button>
          ${cert.status === 'pending' ? `
            <button class="btn btn-success" onclick="approveCertification(${cert.id})">通过</button>
            <button class="btn btn-danger" onclick="rejectCertification(${cert.id})">拒绝</button>
          ` : ''}
        </td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
    <div class="pagination">
      <button onclick="loadCertifications(${page - 1})" ${page <= 1 ? 'disabled' : ''}>上一页</button>
      <span>第 ${page} / ${totalPages} 页，共 ${total} 条</span>
      <button onclick="loadCertifications(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>下一页</button>
    </div>
  `;
  
  document.getElementById('certificationsTable').innerHTML = html;
}

function searchCertifications() {
  loadCertifications(1);
}

async function viewCertification(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/certifications?page=1&pageSize=100`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (data.success) {
      const cert = data.data.list.find(c => c.id === id);
      if (cert) {
        showCertificationDetail(cert);
      }
    }
  } catch (error) {
    console.error('查看认证详情错误:', error);
  }
}

function showCertificationDetail(cert) {
  const typeMap = {
    'student': '学生认证',
    'teacher': '教师认证'
  };
  
  let html = `
    <div style="line-height: 2;">
      <p><strong>认证类型：</strong>${typeMap[cert.type] || cert.type}</p>
      <p><strong>真实姓名：</strong>${cert.real_name}</p>
      <p><strong>身份证号：</strong>${cert.id_card}</p>
      <p><strong>学号/工号：</strong>${cert.student_id || '-'}</p>
      <p><strong>学校：</strong>${cert.school}</p>
      <p><strong>学院：</strong>${cert.college || '-'}</p>
      <p><strong>专业：</strong>${cert.major || '-'}</p>
      <p><strong>年级：</strong>${cert.grade || '-'}</p>
      <p><strong>提交时间：</strong>${new Date(cert.submitted_at).toLocaleString()}</p>
  `;
  
  if (cert.id_card_front) {
    html += `<p><strong>身份证正面：</strong><br><img src="${API_BASE_URL.replace('/api', '')}${cert.id_card_front}" class="cert-image"></p>`;
  }
  if (cert.id_card_back) {
    html += `<p><strong>身份证反面：</strong><br><img src="${API_BASE_URL.replace('/api', '')}${cert.id_card_back}" class="cert-image"></p>`;
  }
  if (cert.student_card) {
    html += `<p><strong>学生证/工作证：</strong><br><img src="${API_BASE_URL.replace('/api', '')}${cert.student_card}" class="cert-image"></p>`;
  }
  
  if (cert.status === 'rejected' && cert.reject_reason) {
    html += `<p><strong>拒绝原因：</strong>${cert.reject_reason}</p>`;
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
    const response = await fetch(`${API_BASE_URL}/admin/certifications/${id}/review`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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
    alert('审核失败');
    console.error('审核认证错误:', error);
  }
}

async function rejectCertification(id) {
  const reason = prompt('请输入拒绝原因：');
  if (!reason) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/admin/certifications/${id}/review`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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
    alert('操作失败');
    console.error('审核认证错误:', error);
  }
}

// 页面加载时检查登录状态
window.addEventListener('DOMContentLoaded', () => {
  if (token) {
    showAdminPanel();
  }
});
