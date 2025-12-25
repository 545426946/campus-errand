// 临时修复个人资料保存问题的方案

const fs = require('fs');
const path = require('path');

console.log('=== 应用临时修复方案 ===\n');

// 1. 修改前端profile.js，添加错误处理和模拟保存
const profileJsPath = path.join(__dirname, 'errand-front/pages/profile/profile.js');

console.log('正在修复前端个人资料页面...');

// 读取原始文件
let profileContent = fs.readFileSync(profileJsPath, 'utf8');

// 添加临时修复：如果API失败，使用本地存储
const tempFixCode = `
// 临时修复：API失败时的本地存储方案
const tempUpdateProfile = async function(updateData) {
  console.log('使用临时修复方案保存个人信息到本地存储');
  
  // 更新本地存储中的用户信息
  const currentUserInfo = wx.getStorageSync('userInfo') || {};
  const updatedUserInfo = {
    ...currentUserInfo,
    ...updateData
  };
  wx.setStorageSync('userInfo', updatedUserInfo);
  
  // 显示成功消息
  wx.showToast({
    title: '保存成功（本地模式）',
    icon: 'success',
    duration: 2000
  });
  
  // 返回模拟的成功响应
  return {
    success: true,
    code: 0,
    data: updatedUserInfo,
    message: '个人信息已保存到本地（临时修复）'
  };
};
`;

// 插入临时修复代码到文件中
const insertPosition = profileContent.indexOf('// 调用后端API更新用户信息');
if (insertPosition !== -1) {
  profileContent = profileContent.substring(0, insertPosition) + 
                  tempFixCode + 
                  profileContent.substring(insertPosition);
  
  // 修改API调用为使用临时修复
  profileContent = profileContent.replace(
    'const result = await userAPI.updateUserProfile(updateData);',
    `// 尝试调用真实API，失败则使用临时修复\n      let result;\n      try {\n        result = await userAPI.updateUserProfile(updateData);\n      } catch (apiError) {\n        console.warn('真实API调用失败，使用临时修复方案:', apiError);\n        result = await tempUpdateProfile(updateData);\n      }`
  );
  
  // 写回文件
  fs.writeFileSync(profileJsPath, profileContent, 'utf8');
  console.log('✅ 个人资料页面修复完成');
} else {
  console.log('❌ 无法找到插入位置');
}

console.log('\n=== 修复完成 ===');
console.log('现在您可以尝试保存个人信息，如果服务器API失败，会自动使用本地存储模式');
console.log('注意：这是临时解决方案，数据仅保存在本地，不会同步到服务器');
console.log('\n建议：');
console.log('1. 确保后端服务器在 192.168.1.161:3000 运行');
console.log('2. 检查用户认证token是否有效');
console.log('3. 完善后端API接口');