# 图鉴维护规则

这是部署到 GitHub Pages 的静态个人视觉图鉴。界面使用原生 HTML、CSS 和 JavaScript，没有构建依赖。

- 保留来源、作者、许可和原作稳定编号。按来源与编号去重，不把名字相似的不同实现盲目合并。
- 原作目录和运动参数保存在 data.js；原始 Canvas 代码在 runtime.js、motion-samples.js、motion-artstyle.js，并保留 MIT 头部。
- 调整源数据时同步核对 THIRD_PARTY_NOTICES.md、界面统计与 README。复用材料前读取当前许可，尤其注意 Lemo 风格文档和 Video Talkcraft 的非商业限制。
- 个人收藏、备注、自建参考和组合保存在浏览器 localStorage，导入必须验证字段、限制大小并处理 URL；不执行导入的代码或 HTML。
- 不把 Token、Cookie、私人知识库、个人备份、日志或账号凭证提交到仓库。
- 修改后检查 JavaScript 语法，在浏览器检查检索、动态预览、收藏保存、提示词复制、组合和手机布局。
- 去色预览不等同于自动提取运动骨架；不要把未制作的风格混合预览描述成真实渲染结果。
