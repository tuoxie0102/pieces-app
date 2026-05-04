请把以下规则写入 AGENTS.md，作为本项目长期开发规则：
- 本项目是安卓 APK 内测版灵感记录 App
- 使用 React Native + Expo
- 不做网页版本
- 第一阶段使用本地状态/AsyncStorage
- 不允许重写项目大框架
- 每次只允许完成一个明确小功能
- 必须保留：首页 / 灵感库 / 创作区 / 成果库 / 我的
- 必须保留核心路径：灵感 → 标签 → 关联 → 项目 → 成果 → Impact → 分享卡片
- 修改前说明计划，修改后说明改动文件

## 🔒 Android 构建与数据保留规则（必须遵守）

以下规则用于保证内测版本升级（ver1 → ver2）时，用户数据不会丢失。

1. 不允许修改 android.package
- 示例：com.pieces.ideaapp
- 一旦发布，不得更改
- 否则会被系统视为新应用

2. 必须使用同一套 Android 签名（keystore）
- 不允许重新生成签名
- EAS Build 必须复用已有 credentials

3. versionCode 必须递增
- 每次发布新版本必须增加 versionCode
- versionName（如 1.0.1）可以自由调整

4. 禁止删除或修改已有 AsyncStorage key
必须保持以下 key 不变：
- pieces_ideas
- pieces_tags
- pieces_idea_tags
- pieces_projects
- pieces_project_ideas
- pieces_outcomes
- pieces_settings
- pieces_schema_version

5. 如需修改数据结构，必须通过 migration 实现
- 不允许直接覆盖旧数据
- 必须兼容旧版本数据

6. 不允许引入会清空本地数据的逻辑
- 包括重置 storage、clearAll 等操作

违反以上规则会导致用户数据丢失，必须避免。