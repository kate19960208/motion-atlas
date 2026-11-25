# 第三方来源与改动记录

本库为个人视觉参考与制作研究提供统一检索入口。界面与个人数据功能为新制作，来源作品的权利仍属于各自作者。

## Motion Prompt

- 原作：https://github.com/showheyohtaki/motion-prompt
- 动态图鉴：https://showheyohtaki.github.io/motion-prompt/
- 作者：Shohei Ohtaki / 大滝昇平
- 许可：MIT，完整文本在 `LICENSE-Motion-Prompt.txt`。
- 复用：264 条 API 目录的名称、说明、运动参数，以及 runtime 和各 pack 的 Canvas 实现（合并为 motion-samples.js，artstyle 独立按需加载）。
- 改动：新建中文检索、收藏和组合界面；提取需要的目录字段；artstyle 的图片路径指向原作公开站点，保留原作代码署名。没有更改动作的物理参数。

## Video Shotcraft

- 原作：https://github.com/Vincentwei1021/video-shotcraft
- 图鉴：https://vincentwei1021.github.io/video-shotcraft/
- 作者：Vincentwei1021 / Vincent Wei
- 许可：Apache-2.0，完整文本在 `LICENSE-Video-Shotcraft.txt`。
- 复用：官方 `gallery/api/library.json` 的镜头目录、中文名称和 150 个样例的说明、运动意图与时间信息。
- 改动：按样例稳定编号整理为独立条目，形成中文使用提示词；样例视频由原作站点提供，原作镜头规范保持链接。
- 原作者对参考作品的归属与边界说明：https://github.com/Vincentwei1021/video-shotcraft/blob/main/references/shots/ATTRIBUTION.md

## MG Styles 15

- 原作：https://github.com/Vincentwei1021/mg-styles-15
- 图鉴：https://vincentwei1021.github.io/mg-styles-15/
- 作者：Vincentwei1021
- 许可：MIT，完整文本在 `LICENSE-MG-Styles-15.txt`。
- 复用：15 套风格的名称、说明、原作完整提示词；图片和视频通过原作公开地址展示。
- 改动：接入统一卡片、检索、收藏与组合功能，没有声称原作提示词或成片属于本库原创。

## Lemo-Opuscar

- 原作：https://github.com/lemomo-ai/lemo-opuscar
- 图鉴：https://lemomo-ai.github.io/lemo-opuscar/
- 创作者：Lemomo / LemoLab；当前许可主体见原作 LICENSE。
- 目录与代码：MIT。示例画面、影片与相应剧照：CC BY 4.0，署名 LemoLab。Markdown 风格文档及部分图像提示词：CC BY-NC 4.0。完整范围记录在 `LICENSE-Lemo-Opuscar.txt`。
- 复用：99 种风格的公开目录；参考图与原作视频以外链展示，保留署名。
- 改动：制作本库整理的中文使用提示词，明确标记为本库整理；完整 STYLE.md 保持原始链接，没有全文复制到本库。
- 原作影片含第三方素材时，仍须按具体影片的 CREDITS 和 REUSE.toml 核对相应条款。

## Video Talkcraft

- 参考入口：https://vincentwei1021.github.io/video-talkcraft/
- 原作：https://github.com/Vincentwei1021/video-talkcraft
- 当前工具许可：PolyForm Noncommercial；商业使用需作者事先授权。
- 本库只提供参考链接与简短用途说明，没有复制其工具代码、完整镜头数据或工作台。

## 组织方法与其他参考

- 一页枝鸥：《vibe知识大赏｜做视频包装如何建立自己的视觉素材参考图鉴》：https://www.douyin.com/video/7708581319843794191
- Open Prompt Gallery：https://github.com/Joycai/open-prompt-gallery
- MotionPrompt Library：https://github.com/TattvaAI/prompt-library

这些来源用于学习“风格与动作分开积累”“卡片附提示词”“个人指纹与组合”的组织方法。没有将原视频、私人知识库原文或这些项目的后端代码复制到本站。
