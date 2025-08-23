import { Client, Databases, ID } from 'node-appwrite';
import { DATABASE_CONFIG } from './config.js';

/**
 * Setup script to ensure database and collections exist
 * This runs during the build process
 */
const setup = async () => {
  console.log('Setting up database for generate-lyrics function...');
  
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_FUNCTION_API_KEY);
    
    const databases = new Databases(client);
    
    // Check if database exists
    try {
      await databases.get(DATABASE_CONFIG.DATABASE_ID);
      console.log('Database exists');
    } catch (error) {
      if (error.code === 404) {
        console.log('Creating database...');
        await databases.create(
          DATABASE_CONFIG.DATABASE_ID,
          DATABASE_CONFIG.DATABASE_NAME
        );
      } else {
        throw error;
      }
    }
    
    // Check and create collections
    for (const [collectionKey, collection] of Object.entries(DATABASE_CONFIG.COLLECTIONS)) {
      try {
        await databases.getCollection(DATABASE_CONFIG.DATABASE_ID, collection.id);
        console.log(`Collection ${collection.id} exists`);
      } catch (error) {
        if (error.code === 404) {
          console.log(`Creating collection ${collection.id}...`);
          await databases.createCollection(
            DATABASE_CONFIG.DATABASE_ID,
            collection.id,
            collection.name,
            collection.permissions,
            collection.documentSecurity
          );
          
          // Create attributes
          for (const attr of collection.attributes) {
            console.log(`Creating attribute ${attr.key}...`);
            await createAttribute(databases, collection.id, attr);
            // Wait a bit between attribute creation to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          // Create indexes if defined
          if (collection.indexes) {
            for (const index of collection.indexes) {
              console.log(`Creating index ${index.key}...`);
              await databases.createIndex(
                DATABASE_CONFIG.DATABASE_ID,
                collection.id,
                index.key,
                index.type,
                index.attributes,
                index.orders
              );
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        } else {
          throw error;
        }
      }
    }
    
    console.log('Setup completed successfully');
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
};

const createAttribute = async (databases, collectionId, attr) => {
  const baseParams = [
    DATABASE_CONFIG.DATABASE_ID,
    collectionId,
    attr.key,
    attr.required
  ];
  
  switch (attr.type) {
    case 'string':
      await databases.createStringAttribute(
        ...baseParams,
        attr.size,
        attr.default,
        attr.array
      );
      break;
    case 'integer':
      await databases.createIntegerAttribute(
        ...baseParams,
        attr.min,
        attr.max,
        attr.default,
        attr.array
      );
      break;
    case 'boolean':
      await databases.createBooleanAttribute(
        ...baseParams,
        attr.default,
        attr.array
      );
      break;
    case 'datetime':
      await databases.createDatetimeAttribute(
        ...baseParams,
        attr.default,
        attr.array
      );
      break;
  }
};

// Run setup if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  setup();
}
