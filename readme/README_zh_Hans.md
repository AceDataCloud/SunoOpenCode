# Suno by Ace Data Cloud：OpenCode 原生插件

在 **OpenCode 2** 里使用 Suno 音乐、歌词和任务结果。安装后在原生 `/connect` 填入 Ace API Token，插件自动注册托管 Suno MCP 与 `suno-music` Skill，无需手写 MCP JSON。复用 [SunoMCP](https://github.com/AceDataCloud/SunoMCP)，不复制 API 实现或增加模型 fallback。

这是 **Ace Data Cloud** 提供的独立集成，不是 Suno 或 OpenCode 官方产品，也没有宣称获得其背书。[English](../README.md) · [隐私与费用](../PRIVACY.md) · [图片来源](../docs/SOURCES.md)。

## 1. 通过 OpenCode 插件管理器安装

要求 **OpenCode 2.0.26+**。先运行 `opencode --version`；OpenCode 1 插件 API 不同。版本安装见 [官方文档](https://opencode.ai/v2/docs/)。

本插件使用官方支持的 Git 包分发；尚未发布 npm，官方生态目录投稿也不等于已收录。审查合并后使用：

```bash
opencode plugin add github:AceDataCloud/SunoOpenCode
```

实现 PR 尚未合并时，只能选择明确的候选分支：

```bash
opencode plugin add 'github:AceDataCloud/SunoOpenCode#codex/suno-native-plugin'
```

如果 HTTPS 快捷地址受本机网络影响，可使用本轮已由官方插件管理器验证的 Git SSH 形式（沿用你已有的 GitHub SSH 访问，不要求扩权）：

```bash
opencode plugin add 'git+ssh://git@github.com/AceDataCloud/SunoOpenCode.git#codex/suno-native-plugin'
```

安装候选前先审查代码。主线发布后，先 `opencode plugin remove 'github:AceDataCloud/SunoOpenCode#codex/suno-native-plugin'` 再装主线，不要同时装两份。插件添加原生 **Suno by Ace Data Cloud** 凭据入口、`suno-by-acedatacloud` MCP 和 Suno Skill；聊天模型仍由用户自行选择和计费。

## 2. 注册登录并获取应用 API Token

1. 打开 [Ace Applications](https://platform.acedata.cloud/console/applications?utm_source=github&utm_medium=referral&utm_campaign=evergreen&utm_content=opencode_suno_plugin_zh_key)，注册或登录，找到 **General application（通用应用）**。没有时先点 **Initialize General Application**。
2. 核对 Suno 权限、余额与 [当前价格](https://platform.acedata.cloud/models?utm_source=github&utm_medium=referral&utm_campaign=evergreen&utm_content=opencode_suno_plugin_zh_pricing)。专用应用的 Token 可能只允许该服务。
3. 在卡片复制 API Key；也可进入 **Manage Keys → Create** 创建名为 `OpenCode Suno` 的独立 Key。

![Ace 应用里复制 Key 或进入管理；这不是 OpenCode 界面](../assets/get-api-key-en.png)

4. 核对有效期和用量限制。如启用 **Allowed APIs**，音乐首用至少允许 `/suno/audios`、`/suno/tasks`；歌词等操作可能需要其他 API。

![创建单独的应用 Key；真实凭据已遮挡](../assets/create-api-key-en.png)

图片复用作者自有 SunoDify 教程的固定 commit，2026-10-18 收集使用；它们说明 Ace 账号步骤，不是 OpenCode 操作。图中 `Dify tutorial` 是原教程示例名，这里请填 `OpenCode Suno`。复制原始 Token，不加 `Bearer `、空格或引号。`platform-...` 管理 Token 不能代替生成 Key。以账号实际显示的余额为准，不保证免费额度。

## 3. 在 OpenCode 原生入口粘贴

安装后重新加载 OpenCode，输入 `/connect`，选择 **Suno by Ace Data Cloud → Ace Data Cloud API Token — Suno**，粘贴原始 Token。凭据由 OpenCode 保存；插件仅在内存中把它发送给固定 Suno MCP，不写入项目文件或提示词。打开 `/mcp` 查看 `suno-by-acedatacloud`；未连接 Key 时服务保持关闭。

环境变量方式可在服务进程启动前导出 `ACEDATACLOUD_SUNO_API_TOKEN`。旧后台服务不会自动继承另一个终端的变量，首次核对可运行 `opencode --standalone`。不要把 Key 发给模型。

![OpenCode 官方真实终端参考图；不是该插件或 Ace 执行](../assets/opencode-original-1.png)

官方原图于 2026-10-17 收集，拍摄日期和精确版本未知。仅展示真实终端布局，不能证明本插件 `/connect` 界面或 Ace 调用。插件原生对话框截图待协调排队；上面的标签已通过 OpenCode 2 本地接口核对，不制作假界面。

## 4. 先查看信息，不生成媒体

在已连接的会话里要求：

```text
用 suno_list_models 查看当前 Suno 模型；不要生成任何内容，也不要调用其他服务。
```

这一步只查服务模型信息，但聊天模型对话本身可能计费。以实际工具 Schema 为准，不沿用历史模型、时长或参数。

## 5. 只生成一次，用同一个 task_id 查终态

明确批准当前 Suno 价格和预算后，用 `suno_generate_music` 提交一次。保存返回的 `task_id`，后续只用 `suno_get_task` 查询：

```text
用 suno_get_task 查询 Suno 任务 <已有task_id>，不要提交、重试或重新生成。
报告当前状态，仅在任务确认完成时把音频链接标为最终结果。
```

`pending`/`processing` 继续等同 ID。预览链接、连接成功或模型说完成都不是终态。远程 MCP 将明确成功归一为 `complete`、失败归一为 `failed`；核对返回状态及最终 `audio_url`。失败、超时或限流先查原任务，再决定是否批准新收费请求。插件安装不生成、不自动收费重试。

## 常见问题

- 找不到入口：核对 OpenCode 2、插件目标、加载清单，再 reload。
- MCP 关闭：先 `/connect` 或把变量传给服务进程。
- 401/403：检查完整 Token、权限、有效期、Allowed APIs 和余额，不向支持人员发 Key。
- 一直 pending：只查询同一 ID，不要再次生成来轮询。
- 429/5xx/超时：保留原任务/trace ID，减少并发，查看状态后再决定新请求。
- 已有同名配置：用户自己的 `suno-by-acedatacloud` 配置优先，插件不会覆盖。

聊天模型和 Suno 服务费用分开。安装/连接成功不证明歌曲完成、唯一账单或营收。[API 文档](https://platform.acedata.cloud/documents/suno-mcp?utm_source=github&utm_medium=referral&utm_campaign=evergreen&utm_content=opencode_suno_plugin_zh_docs) · [反馈](https://github.com/AceDataCloud/SunoOpenCode/issues)。
