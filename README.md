# Infinite Canvas AI Omnigen

An enhanced infinite canvas image and video editor with comprehensive AI model integration. Built on top of [fal-ai-community/infinite-kanvas](https://github.com/fal-ai-community/infinite-kanvas), this project extends the original with multi-model AI capabilities, video processing features, and client-side API key management.

🌟 **Live Demo**: [infinite-canvas-aiomnigen](https://infinite-canvas.aiomnigen.com) (deployed on Vercel)

## What's New & Enhanced

This project builds upon the excellent foundation of the original infinite-kanvas and adds:

### 🎯 **Multi-Model AI Integration**
- Support for various fal.ai models including the powerful **Nano Banana** model
- Comprehensive image editing with multiple AI backends

### 🔑 **Client-Side API Management**
- API keys are used directly in the browser, eliminating the need for a backend proxy.
- Simplified setup with no server-side dependencies.
- API keys are stored in local storage, and it's recommended to use keys with restricted permissions for security.

> ⚠️ **Important Note**: 
> - This project uses fal.ai SDK on the client side, and API keys are stored in local storage.
> - Make sure to use API keys in trusted environments only and apply the necessary permission restrictions.

## Features

### AI-Powered Model
- **Multiple AI models** from fal.ai platform
- **Text-to-image** generation
- **Image-to-image** transformations
- Support more AI video models

### Video Processing
- **Video frame extraction**
- **Video trimming**

### User Experience
- **In-app API key management** - no environment setup required
- **Modern UI** built with Tailwind CSS

## Quick Start

### Prerequisites
- Node.js 18+
- npm, yarn, pnpm, or bun
- A fal.ai API key (get one at fal.ai)

### Installation & Setup

```bash
# Clone the repository
git clone https://github.com/SparkSylva/Infinite-Canvas-AI-Omnigen.git

cd Infinite-Canvas-AI-Omnigen

# Install dependencies
npm install

# Start development server
npm run dev
```

That's it! No environment variables or backend setup required.

Open [http://localhost:3000](http://localhost:3000) in your browser and start creating!

### Configuration

1. Open the application in your browser
2. Open the settings panel
3. Enter your fal.ai API key directly in the UI
4. Start using AI models immediately

> 💡 **API Key Usage**:
>
> * This application calls the fal.ai API directly from the client, with no server-side proxy required.
> * API keys are managed and used directly in the browser, simplifying the deployment process.
> * All AI requests are sent from the browser directly to fal.ai's servers.
> * This approach avoids complex backend setup but requires users to manage their API key security.

## Tech Stack

### Frontend Framework

* **Next.js 15** - React framework with App Router

### Canvas & Graphics

* **React Konva** - High-performance 2D canvas rendering

### AI Integration

* **fal.ai SDK** - Integration with multiple AI models, including Nano Banana, Flux, Wan2.2, and more.

### Video Processing

* **ffmpeg.wasm** - Client-side video processing
* WebAssembly-based FFmpeg for browser

### Styling & UI

* **Tailwind CSS v4** - Modern utility-first CSS framework
* **Shadcn/ui** - High-quality React components

### Storage

* **IndexedDB** - Client-side persistent storage

## Key Dependencies

This project is built on top of several excellent open-source projects:

* [fal-ai-community/infinite-kanvas](https://github.com/fal-ai-community/infinite-kanvas) - Original infinite canvas foundation
* [ffmpegwasm/ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) - Client-side video processing
* [konvajs/react-konva](https://github.com/konvajs/react-konva) - React bindings for Konva 2D canvas
* [fal-ai/fal-js](https://github.com/fal-ai/fal-js) - fal.ai JavaScript SDK
* [vercel/next.js](https://github.com/vercel/next.js) - React framework

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

This project is built on top of the [fal-ai-community/infinite-kanvas](https://github.com/fal-ai-community/infinite-kanvas) project, which is also licensed under the MIT License.

## Differences from Original

### Additions ✅

* Multi-model AI support
* Video processing and frame extraction
* Client-side API key management
* Image cropping and editing tools

### Modifications 🔄

* Removed backend proxy; now uses direct client-side API calls.
* Simplified setup process: no server or environment variables needed.

### Removed Features ❌

* Some original backend features (focused on client-side usage).

## Development

### Available Scripts

```bash
npm run dev      # Start development server
```

### Project Structure

```
src/
├── app/                 # Next.js App Router
├── components/          # React components
│   ├── canvas/         # Canvas-related components
│   ├── ui/            # Reusable UI components
│   └── application/   # Main application components
├── lib/                # Utility libraries
├── types/              # TypeScript type definitions
└── server-action/      # AI generation actions include client version
```

## Contributing

We welcome contributions! This project builds on the excellent work of the original infinite-kanvas team. Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Acknowledgments

Special thanks to:

* [fal-ai-community](https://github.com/fal-ai-community) for the original infinite-kanvas project
* [React Konva team](https://github.com/konvajs/react-konva) for the powerful 2D canvas rendering library
* [FFmpeg.wasm team](https://github.com/ffmpegwasm) for making video processing possible in browsers
* [Shadcn/ui](https://github.com/shadcn/ui) for high-quality React components
* The entire open-source community for the amazing tools and libraries

---

**Made with ❤️ using Next.js and powered by fal.ai**
