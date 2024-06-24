# 全興書苑預約平台

## 介紹

全興書苑預約平台是一個提供全興書苑場地預約服務的平台，使用者可以透過此平台查看全興書苑場地的預約狀況，並進行預約和查看自己的預約紀錄。

## 功能

- 查看全興書苑場地的預約狀況
- 進行場地預約
- 查看個人預約紀錄

## 系統架構

### 系統架構圖

![系統架構圖](./docs/system-architecture.png)

說明：
- 藍色組件代表 View 視圖，負責顯示畫面
- 橘色組件代表 Pinia Store 狀態管理，負責管理應用程式狀態
- 黃色組件代表 Service 服務，負責處理共用業務邏輯
- 紅色組件代表 API 服務，負責與Supabase進行通訊

註：此為依賴圖，箭頭指向代表依賴關係，不同顏色僅為區分不同類型組件，虛線箭頭代表 View 視圖是直接依賴 API 服務的，應該避免直接依賴 API 服務，建議後續可以優化。

#### View 視圖

- **App**：應用程式的根組件，包含 Navbar, Footer, SignInDialog, SignUpDialog 等組件
- **Home**：首頁，顯示全興書苑場地的預約狀況
- **Profile**：個人資料頁面，顯示個人預約紀錄
- **Admin**：管理員頁面，顯示所有預約紀錄、管理使用者/座位、修改設定等

#### Pinia Store 狀態管理

- **AccountStore**：管理使用者資訊，包含登入狀態、使用者資料等
- **SettingStore**：管理應用程式設定，包含全興書苑場地資訊、預約規則等
- **SeatStore**：管理座位資訊，包含座位狀態、預約紀錄等
- **FilterStore**：管理過濾條件，包含日期時間等，並提供給 SeatMap 等組件使用

#### Service 服務

`vue 3` 的 Service 通常以 `composable` 的形式提供。

- **ReservationComposable**：提供預約相關業務邏輯，包含查看預約紀錄。
- **ProfileComposable**：提供個人資料相關業務邏輯，包含查看個人資料、修改個人資料等。

#### API 服務

- **SupabaseService**：設定 Supabase 連線，提供與 Supabase 進行通訊的方法
- **SeatAPI**：提供與座位相關的 API 服務，包含查詢座位狀態、預約座位等
- **UserAPI**：提供與使用者相關的 API 服務，包含查詢使用者資料、修改使用者資料等
- **ReservationAPI**：提供與預約相關的 API 服務，包含查詢預約紀錄、新增預約紀錄等

### 技術棧

- 前端框架：Vue 3.3.11
- 資料庫：Supabase 2.43.5

#### 相關套件

- **Element Plus 2.6.3**：提供 UI 元件
- **Vueuse 10.9.0**：提供實用功能
- **Konva 9.3.0 / vue-konva 3.0.2**：提供繪製圖形功能
- **vue-router 4.2.5**：提供路由功能
- **Pinia 2.1.7 / pinia-plugin-persistedstate 3.2.1**：提供狀態管理及持久化功能

## 開發

### 環境需求

使用 Bun 1.0.25 進行開發。

#### 安裝 Bun

詳見 [官方文件](https://bun.sh/docs/installation)

### 開發步驟

開發分為兩個部分：啟動前端及啟動 Supabase。

1. 安裝相依套件

```bash
bun install
```
2. 啟動開發伺服器

```bash
bun dev
```
3. 打開瀏覽器並前往 `http://localhost:3000` 查看網站
4. 啟動 Supabase

```bash
git clone https://github.com/supabase/supabase.git
cd supabase/docker
docker compose up -d
```
5. 打開瀏覽器並前往 `http://localhost:8000` 查看 Supabase 管理介面
6. 確認前端可以正常連接 Supabase

## 部署

使用 Docker 進行部署。

1. 建立 Docker Image

```bash
docker build -t book-reservation .
```

2. 啟動 Docker Container

```bash
docker run -d --network host book-reservation
```

使用 `--network host` 參數，讓 Docker Container 與本機共用網路，方便連接 Supabase。

3. 啟動 Supabase

```bash
git clone https://github.com/supabase/supabase.git
cd supabase/docker
docker compose up -d
```