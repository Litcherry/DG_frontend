# A5 景区导览服务 AI 数字人前端

这是一个免构建的前端 SPA，直接对接 `DG_backend` 的 FastAPI 接口。

## 页面能力

- 游客交互端：会话创建、兴趣选择、SSE 流式问答、TTS 播放、语音输入 ASR、路线推荐、满意度反馈。
- 管理后台：管理员登录、数据大屏、知识文档上传、FAQ 新增、景点路线新增、数字人配置。
- 数字人演示：使用 CSS 2D 数字人表现说话状态和情绪状态，后续可替换为 Live2D、SadTalker、MuseTalk 或其他 2D/3D 驱动引擎。

## 启动方式

先确保后端和 AI 服务已经启动：

```powershell
# DG_backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# DG_ai
python -m uvicorn main:app --host 0.0.0.0 --port 8100
```

然后启动前端静态服务：

```powershell
cd C:\Project_vscode\DG\DG_frontend
python serve.py --host 127.0.0.1 --port 5173
```

也可以使用 npm 脚本：

```powershell
cd C:\Project_vscode\DG\DG_frontend
npm start
```

打开：

```text
http://127.0.0.1:5173
```

页面里的后端服务地址保持：

```text
http://localhost:8000
```

浏览器语音输入需要麦克风权限，建议通过 localhost 访问。管理后台使用后端初始化的管理员账号登录。
