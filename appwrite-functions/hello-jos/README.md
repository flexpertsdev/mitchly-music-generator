# Hello Jos - Test Appwrite Function

This is a test Appwrite function that demonstrates:
- Accepting JSON body with a 'prompt' field
- Logging the received prompt
- Creating a document in the 'tests' collection
- Returning a dynamic response

## Function Details

### Input
The function expects a JSON body with the following structure:
```json
{
  "prompt": "Your prompt text here"
}
```

### Processing
1. Parses the JSON body to extract the 'prompt' field
2. Logs the prompt value to the console
3. Creates a new document in the 'tests' collection with:
   - `prompt`: The received prompt text
   - `createdAt`: Timestamp of creation

### Output
Returns a JSON response with:
- `success`: Boolean indicating if the operation was successful
- `message`: A dynamic message including the prompt
- `documentId`: The ID of the created document
- `timestamp`: Current timestamp

### Environment Variables Required
- `APPWRITE_FUNCTION_ENDPOINT`: Appwrite endpoint URL
- `APPWRITE_FUNCTION_PROJECT_ID`: Appwrite project ID
- `APPWRITE_FUNCTION_API_KEY`: Appwrite API key with necessary permissions
- `APPWRITE_DATABASE_ID`: Database ID (optional, defaults to 'default')

### Prerequisites
Before using this function, ensure:
1. You have a database in your Appwrite project
2. You have a collection named 'tests' with a string attribute called 'prompt'
3. The API key has permissions to create documents in the collection

### Testing
You can test this function by sending a POST request with:
```bash
curl -X POST https://[YOUR-APPWRITE-ENDPOINT]/v1/functions/[FUNCTION-ID]/executions \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: [PROJECT-ID]" \
  -d '{"prompt": "Hello from test!"}'
```
