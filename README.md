# mytonstorage.org

**[Русская версия](README.ru.md)**

Frontend for https://mytonstorage.org

**Tech stack:** Next.js, TypeScript, TailwindCSS, TON Connect for wallet integration, Zustand with localStorage persistence.

**Backends:** TonCenter API for transactions list and contracts detailed info, mytonstorage.org backend upload files and manage contracts, mytonprovider.org backend for some providers info.

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

### Building for Production

```bash
# Build the application
npm run build
```

The build output will be available in the `.out` directory.


## Project Structure

```
# Classic structure for project like this
app/                # App directory
components/         # Reusable UI components
hooks/              # Custom React hooks
lib/                # Utility functions and API calls
types/              # TypeScript type definitions
public/             # Static assets
```

## License

Apache-2.0



This project was created by order of a TON Foundation community member.
