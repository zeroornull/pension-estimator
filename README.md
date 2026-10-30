# 职工基本养老金估算

在浏览器里估算职工基本养老金。改一个数，每月金额马上变。计算在本机完成，参数不上传。

**网站：** https://pension-estimator.zeroornull.workers.dev

这是估算，不是社保机构的核定结果。不含过渡性养老金和地方补贴。通胀只把退休时的金额折成今天的购买力，不提高工资，也不提高计发基数。地方参数以退休地最新通知为准。

## 可以做什么

- 按退休地填入计发基数和缴费基数参考，退休地可以搜索
- 按出生年月给出法定退休年龄，也可以改成手填退休年月
- 分开显示基础养老金、个人账户养老金，以及折成现在购买力的金额
- 附上国家层面政策原文和官方查询入口

草稿保存在这台浏览器的 `localStorage`（`pension-estimator.draft.v1`）。

## 本地运行

需要 Node.js 20.19 或更新版本。

```bash
npm install
npm run dev
```

```bash
npm test
npm run build
```

## 部署

已登录 Cloudflare 后：

```bash
npm run deploy
```

第一次使用官方 `cf` 时，先执行 `npx cf auth login`。

---

# Employee Basic Pension Estimator

Estimate an employee basic pension in the browser. Change one number and the monthly amount updates immediately. The calculation stays on your device, and the inputs are not uploaded.

**Website:** https://pension-estimator.zeroornull.workers.dev

This is an estimate, not a determination by a social insurance agency. It does not include the transitional pension or local supplements. Inflation only restates the amount at retirement in today's purchasing power. It does not raise wages or the pension base. Local parameters follow the latest notice for the retirement locality.

## What it does

- Fills the pension base and contribution reference for a retirement city, and the city field can be searched
- Derives the statutory retirement age from the birth month, or accepts a retirement month you type
- Shows the base pension, the personal-account pension, and the amount restated in today's purchasing power
- Links to national policy texts and official lookup services

The draft is stored in this browser's `localStorage` (`pension-estimator.draft.v1`).

## Run locally

Node.js 20.19 or newer is required.

```bash
npm install
npm run dev
```

```bash
npm test
npm run build
```

## Deploy

After you are logged in to Cloudflare:

```bash
npm run deploy
```

The first time you use the official `cf` CLI, run `npx cf auth login`.
