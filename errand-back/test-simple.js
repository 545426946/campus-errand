class TestClass {
  static testMethod() {
    return 'test';
  }
}

module.exports = TestClass;

console.log('导出:', module.exports);
console.log('方法:', typeof module.exports.testMethod);
