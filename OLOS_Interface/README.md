# Open-Lab-Operating-System (OLOS) Interface

## Table of Contents

- [Introduction](#introduction)
- [Tech Stack](#tech-stack)
- [Installation & Setup](#installation--setup)
  - [1. Install Node.js](#1-install-nodejs)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Configure the Interface](#3-configure-the-interface)
  - [4. Run the Development Server](#4-run-the-development-server)
  - [5. Build for Production](#5-build-for-production)
  - [6. Build Native Application Using Electron](#6-build-native-application-using-electron)
- [Documentation](#documentation)
- [Software Architecture](#software-architecture)

---

## Introduction

**OLOS Interface** is the frontend web application for the **Open Lab Operating System (OLOS)**. It provides a rich, interactive, and user-friendly interface for preparing jobs and operating various open-lab fabrication machines connected to the OLOS Server.

This interface is the primary point of interaction for users, enabling complex job preparation and real-time machine control directly from a web browser.

Key features include:

✅ **2D Image-to-G-code Conversion** for vector and raster files (Laser Cutter).

✅ **3D Model Slicing & Preparation** with object manipulation tools (Metal 3D Printer).

✅ **Interactive 2D & 3D G-code Visualization** with layer-by-layer inspection.

✅ **AI-Powered Image Generation** to create designs from text prompts (Laser Cutter).

✅ **File & Media Management** for jobs and source assets.

✅ **Real-time Machine Control & Monitoring.**

---

## Tech Stack

<a href="https://vuejs.org/" title="Vue.js"><img height="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/vue_js.png" alt="Vue.js" /></a>
<a href="https://pinia.vuejs.org/" title="Pinia"><img height="50" src="https://camo.githubusercontent.com/beb4deef34ad522ffbbd05a815abf5b3b1f0943b6aff9ae5c64f356335fe0b99/68747470733a2f2f70696e69612e7675656a732e6f72672f6c6f676f2e737667" alt="Pinia" /></a>
<a href="https://quasar.dev/" title="Quasar Framework"><img height="50" src="https://avatars.githubusercontent.com/u/23064371?s=280&v=4" alt="Quasar Framework" /></a>
<a href="https://www.typescriptlang.org/" title="TypeScript"><img height="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/typescript.png" alt="TypeScript" /></a>
<a href="https://vitejs.dev/" title="Vite"><img height="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/vite.png" alt="Vite" /></a>

## Installation & Setup

### 1. Install Node.js

Ensure **Node.js** (LTS version recommended node >= 20.0.0) is installed.
Download it here: [Node.js Official Website](https://nodejs.org/)

Verify installation:

```bash
node --version
```

if you would like to use yarn, install yarn using:

```bash
npm install --global yarn
```

Verify installation:

```bash
yarn --version
```

---

### 2. Install Dependencies

Install the required npm packages:

```bash
yarn
# or
npm install
```

---

### 3. Configure the Interface

Edit the `config.yaml` file to match your machine and environment settings before running the server.

**PS.** `.env` file contains the interface environment configurations:

- **NODE_ENV** — Defines the environment mode for the application (development, production).
- **FASTAPI_SERVER_URL** — URL address for the FastAPI REST API server.
- **WEBSOCKET_URL** — URL address for the WebSocket server handling real-time communication

---

### 4. Run the Development Server

Start the Vite development server with Hot-Module Replacement (HMR):

```bash
Set-ExecutionPolicy Unrestricted -Scope Process
yarn dev
#or
Set-ExecutionPolicy Unrestricted -Scope Process
npm run dev
```

The application will be available at `http://localhost:9000` by default.

---

### 5. Build For Production

Compile and minify the application for production:

```bash
yarn build
#or
npm run build
```

The production-ready files will be located in the dist/ directory. Then you can serve the application locally using:

```bash
yarn serve
#or
npm run serve
```

The application will be available at `http://localhost:4000` by default.

---

### 6. Build Native Application Using Electron

To create the native application using electron, please run this command:

```bash
yarn build -m electron
#or
npm run build -m electron
```

Then you can access the application inside the directory `dist/electron/Package/<app-name>`

---

## Documentation

This project follows a consistent **in-code documentation** style across all scripts to make the codebase easier to read, maintain, and extend. Documentation is included directly within the source files for components, services, stores, and other modules.

**Documentation Standards**

- **JSDoc/TypeDoc Style Comments** – All TypeScript and JavaScript files use block comments (`/** ... */`) to describe functionality, parameters, return values, and usage examples.

- **Inline Comments** – Short, targeted explanations are placed within functions or logic blocks to clarify complex sections.

- **Type Annotations** – All functions, props, states, and variables are strongly typed with clear definitions in the corresponding `interfaces/` or `types/` folders.

---

## Software Architecture

This project is built with TypeScript, Vue.js, and the Quasar Framework.
The source code is organized within the src directory to maintain a clear separation of concerns and improve maintainability.

**Folder & File Structure:**

- `assets/` – Contains static resources such as images, icons, and other media assets.
- `boot/` – Includes Quasar boot files for initializing app-wide functionality before the app starts.
- `components/` – Reusable Vue components used across multiple pages and layouts.
- `css/` – Custom CSS files and style overrides.
- `interfaces/` – Centralized TypeScript interfaces used throughout the entire project.
- `layouts/` – Defines the structural UI layouts (headers, sidebars, footers) used by different pages.
- `pages/` – Each file or folder represents a page in the application.
- `router/` – Vue Router configuration for page navigation and route guards.
- `services/` – Helper modules and service functions for API calls, data formatting, and utility logic.
- `stores/` – Pinia store modules for centralized state management.
- `types/` – Contains internal project-specific TypeScript types and type definitions for external NPM packages that lack built-in TypeScript support.
- `workers/` – Web Worker scripts for running background tasks without blocking the main thread.
- `App.vue` – The root Vue component that initializes and renders the application.
- `constants.ts` – A central file containing constant values used across the project.

This structure promotes **scalability**, **modularity**, and **maintainability**, making it easier for developers to navigate and contribute to the codebase.
