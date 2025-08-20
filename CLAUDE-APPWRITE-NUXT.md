# CLAUDE-APPWRITE-NUXT.md

## Overview
Technical reference for AI assistants building Nuxt applications with Appwrite backend services. This document provides patterns, architecture principles, and implementation details inferred from production examples.

## Core Concepts

### Architecture Principles
- **Client-side rendering only** - SSR not currently supported with Appwrite
- **Composables pattern** - Centralize state and API logic
- **Environment-based configuration** - Never hardcode sensitive values
- **Permission-based access** - Leverage Appwrite's built-in security model

## Project Structure Pattern
```
/composables/       # Global state and data fetching logic
/components/        # Reusable UI components
/layouts/          # Page layout wrappers
/pages/            # Auto-routed pages
/public/           # Static assets
.env               # Environment variables (git-ignored)
appwrite.ts        # SDK initialization (singleton)
nuxt.config.ts     # Nuxt configuration
```

## Critical Setup Requirements

### 1. Dependencies
```json
{
  "dependencies": {
    "appwrite": "^18.1.1",
    "@appwrite.io/pink": "latest",
    "@appwrite.io/pink-icons": "latest"
  }
}
```

### 2. Nuxt Configuration
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: false,  // REQUIRED: SSR must be disabled
  devtools: { enabled: true }
})
```

### 3. Environment Variables Pattern
```
VITE_APPWRITE_ENDPOINT=https://<REGION>.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT=<PROJECT_ID>
VITE_DATABASE_ID=<DATABASE_ID>
VITE_COLLECTION_ID=<COLLECTION_ID>
```

## SDK Initialization Pattern

### Singleton Client Setup
```typescript
// appwrite.ts
import { Client, Databases, Account } from "appwrite";

const url: string = import.meta.env.VITE_APPWRITE_ENDPOINT;
const project: string = import.meta.env.VITE_APPWRITE_PROJECT;

const client: Client = new Client();
client.setEndpoint(url).setProject(project);

// Export service instances, not the client
export const account: Account = new Account(client);
export const database: Databases = new Databases(client);
```

## Authentication Pattern

### User Session Composable
```typescript
// composables/useUserSession.ts
import { ID } from "appwrite";
import { ref } from "vue";
import { account } from "../appwrite";
import { type Models } from 'appwrite';

const current = ref<Models.Session | null>(null);

export const useUserSession = () => {
    // Core authentication methods
    const register = async (email: string, password: string): Promise<void> => {};
    const login = async (email: string, password: string): Promise<void> => {};
    const logout = async (): Promise<void> => {};
    
    // Initialize on load
    account.getSession('current').then((user: Models.Session) => {
        current.value = user;
    });

    return { current, login, logout, register };
};
```

## Database Interaction Pattern

### Data Composable Structure
```typescript
// composables/useData.ts
import { ID, Query, Models } from "appwrite";
import { database } from "~/appwrite";
import { ref } from "vue";

const databaseId: string = import.meta.env.VITE_DATABASE_ID;
const collectionId: string = import.meta.env.VITE_COLLECTION_ID;

interface DataModel extends Models.Document {
    // Define your data structure
}

const current = ref<DataModel[] | null>(null);

export const useData = () => {
    const fetch = async (): Promise<void> => {
        const response = await database.listDocuments(
            databaseId,
            collectionId,
            [Query.orderDesc("$createdAt"), Query.limit(10)]
        );
        current.value = response.documents as DataModel[];
    };

    const add = async (data: Partial<DataModel>): Promise<void> => {};
    const remove = async (id: string): Promise<void> => {};

    fetch(); // Auto-fetch on composable load

    return { current, fetch, add, remove };
};
```

## Appwrite Database Setup

### Collection Configuration
1. Create database and collection in Appwrite Console
2. Define attributes with appropriate types and constraints
3. Set permissions:
   - `Any` role: Read access (for public data)
   - `Users` role: Create, Update, Delete access

### Permission Model
- Collection-level permissions apply to all documents
- Document-level permissions (if enabled) override collection permissions
- Use `Any` for public read, `Users` for authenticated operations

## Component Patterns

### Conditional Rendering for Auth
```vue
<template>
  <section v-if="user.current.value">
    <!-- Authenticated user content -->
  </section>
  <section v-else>
    <!-- Guest user content -->
  </section>
</template>

<script setup>
const user = useUserSession();
</script>
```

### Form Handling Pattern
```vue
<script setup>
const handleSubmit = async (event) => {
  const form = event.target;
  const formData = new FormData(form);
  
  // Extract and process form data
  const data = {
    field: formData.get('field'),
    // Add userId if needed
    userId: user.current.value?.userId
  };
  
  await someAsyncOperation(data);
  form.reset();
};
</script>
```

## Deployment Configurations

### Appwrite Sites
- **Install command**: `npm install`
- **Build command**: `npm run build`
- **Output directory**: `./.output`
- **Rendering strategy**: Set to SSR or Static in settings
- **Environment variables**: Configure in Appwrite Console

### Netlify
- Standard Nuxt deployment
- Environment variables in Netlify UI
- Automatic Git-based deployments

## Realtime Integration

### Subscription Pattern
```javascript
import { Client } from "appwrite";

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId);

// Subscribe to specific channels
client.subscribe(['collections.*.documents', 'files'], response => {
    if(response.events.includes('collections.*.documents.*.create')) {
        // Handle document creation
    }
});

// Clean up subscriptions
const unsubscribe = client.subscribe(channel, callback);
// Later: unsubscribe();
```

### Channel Types
- `account` - User account changes
- `databases.<ID>.collections.<ID>.documents` - Collection changes
- `documents` - All document changes
- `files` - File operations
- `teams` - Team management
- `executions` - Function executions

## Functions Integration

### Function Structure
```javascript
export default async ({ req, res, log, error }) => {
    // Access headers including JWT
    const jwt = req.headers['x-appwrite-user-jwt'];
    
    // Use dynamic API key
    const client = new Client()
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(req.headers['x-appwrite-key']);
    
    // Return responses
    return res.json({ data: 'response' });
};
```

### Function Authentication
- **Dynamic API keys**: Auto-generated per execution
- **JWT tokens**: For user-context operations
- **Scopes**: Configure in function settings

## Security Best Practices

1. **Never expose API keys in client code**
2. **Use environment variables for all sensitive data**
3. **Implement proper permission models**
4. **Validate all user inputs**
5. **Use JWT for user-context operations in functions**
6. **Enable document-level permissions when needed**

## Common Pitfalls

1. **SSR incompatibility** - Always disable SSR in nuxt.config
2. **Singleton pattern** - Only one Client instance per app
3. **Permission errors** - Ensure proper roles are configured
4. **Environment variables** - Use VITE_ prefix for client-side access
5. **Realtime subscriptions** - Clean up to avoid duplicates
6. **Function cold starts** - Consider warming strategies

## Development Workflow

1. Set up local environment with `.env` file
2. Create Appwrite resources (databases, collections, functions)
3. Develop with composables pattern
4. Test permissions with different user roles
5. Deploy via Git push (both platforms support Git deployment)
6. Monitor via Appwrite Console logs and analytics