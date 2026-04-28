# AI大赛进度看板

## 功能
- 实时倒计时
- 大赛官方节点 vs 沪粤内部节点 双维度时间轴
- 4支参赛队伍进度跟踪（与多维表格实时同步）
- 快捷入口

## 部署步骤

### 1. 安装Vercel CLI
```bash
npm install -g vercel
```

### 2. 登录Vercel
```bash
vercel login
```

### 3. 配置环境变量
在Vercel项目设置中添加环境变量：
- `WPS_ACCESS_TOKEN`: WPS开放平台的访问令牌

获取方式：
1. 访问 https://open.wps.cn 创建应用
2. 获取 Access Token

### 4. 部署
```bash
cd ai-competition-dashboard
vercel --prod
```

## 本地开发
```bash
npm install
vercel dev
```

## 多维表格结构
- file_id: `nJT2QaY261MAwcPf5Y8Prxii7kY1AZMqa`
- sheet_id: `2` (队伍进度跟踪)

字段映射：
| 字段名 | field_id | 类型 |
|--------|----------|------|
| 队伍编号 | F | Number |
| 队伍名称 | G | Text |
| 作品名称 | H | Text |
| 已报名 | I | Checkbox |
| 已完成方案 | J | Checkbox |
| 已完成Demo | K | Checkbox |
| 已完成演示视频 | L | Checkbox |
| 已提交初赛材料 | M | Checkbox |
