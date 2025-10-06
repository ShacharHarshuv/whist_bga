# Israeli Whist BGA - TypeScript Setup

This project has been set up to use TypeScript for Board Game Arena development, following the official BGA documentation.

## TypeScript Setup

### Files Structure

- `src/` - TypeScript source files
  - `israeliwhistshahar.ts` - Main game logic in TypeScript
  - `israeliwhistshahar.d.ts` - Type definitions for the game
  - `define.ts` - AMD module definition for BGA framework
- `bga-framework.d.ts` - BGA framework type definitions
- `tsconfig.json` - TypeScript configuration
- `israeliwhistshahar.js` - Generated JavaScript file (do not edit manually)

### Available Scripts

- `npm run build:ts` - Compile TypeScript to JavaScript once
- `npm run watch:ts` - Watch for TypeScript changes and auto-compile
- `npm run build` - Alias for build:ts
- `npm run watch` - Alias for watch:ts

### Development Workflow

1. **Start TypeScript watch mode:**
   ```bash
   npm run watch:ts
   ```

2. **Edit TypeScript files in the `src/` directory:**
   - `src/israeliwhistshahar.ts` - Main game logic
   - `src/israeliwhistshahar.d.ts` - Type definitions

3. **TypeScript will automatically compile to `israeliwhistshahar.js`**

4. **Upload the generated JavaScript file to BGA Studio**

### TypeScript Configuration

The project is configured to:
- Target ES5 for BGA compatibility
- Compile all TypeScript files into a single `israeliwhistshahar.js` file
- Use no modules (AMD-style with define)
- Include type definitions for the BGA framework

### Type Safety

The setup includes:
- Type definitions for BGA framework (Game interface, Dojo, etc.)
- Game-specific interfaces for Israeli Whist
- Type checking for all game logic

### Important Notes

- **Never edit `israeliwhistshahar.js` directly** - it's generated from TypeScript
- Always work in the `src/` directory for TypeScript files
- The generated JavaScript file is what gets uploaded to BGA Studio
- Type definitions help catch errors during development

## Original JavaScript

The original JavaScript implementation has been converted to TypeScript while maintaining the same functionality and BGA compatibility.
