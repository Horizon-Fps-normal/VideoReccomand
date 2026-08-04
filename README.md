# Series Scout

Series Scout 是一个本地优先的美剧片单软件：发现下一部想看的剧，记录观看状态，按季评分，并把数据保存在自己的设备上。

## 功能

- 内置高分美剧目录与个性化推荐
- 支持中文名、英文名搜索
- 可选接入 TVMaze；也可以在设置中填写 TMDB API Key 搜索更多剧集
- 片单状态：想看、观看中、已看完
- 按季评分、标记“不好看”、删除片单项目
- JSON 数据导入与导出，便于备份和迁移
- 默认使用浏览器本地存储，不需要注册账号或后端数据库

## 本地运行

环境要求：Node.js 22.13 或更高版本。

```bash
npm install
npm run dev
```

然后打开终端输出的本地地址。Windows 用户也可以双击：

- `启动 Series Scout.vbs`
- 如果 `.vbs` 被系统拦截，改用 `启动 Series Scout.cmd`

## 验证

```bash
npm run build
npm test
npm run lint
```

## 数据与隐私

片单、评分和搜索设置默认保存在当前浏览器的 `localStorage` 中，不会自动上传到本项目。TMDB API Key 只保存在当前设备的浏览器本地，并不会写入 Git 仓库；导出的 JSON 备份也应按个人数据妥善保存。

海报和在线搜索结果来自第三方服务 TVMaze、TMDB，相关内容和服务条款以各服务商为准。本项目不提供影视视频文件或在线播放服务。

## 项目结构

```text
app/                       页面、样式与应用逻辑
public/                    图标等静态资源
tests/                     构建结果检查
start-series-scout.ps1    Windows 一键启动脚本
```

## 技术栈

Next.js、React、TypeScript、Vinext、Vite 和 Tailwind CSS。项目保留了 Cloudflare Sites/Vinext 的部署配置，也可以作为普通 Node.js 前端项目运行。
