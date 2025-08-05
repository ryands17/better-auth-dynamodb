# Better-Auth with DynamoDB Adapter

A comprehensive authentication solution using [Better-Auth](https://better-auth.com) with Amazon DynamoDB as the database backend. This project demonstrates a production-ready authentication system with a custom DynamoDB adapter, featuring a React frontend and Express backend.

## Features

- **Custom DynamoDB Adapter**: Fully-featured adapter supporting all Better-Auth operations
- **Single Table Design**: Optimized DynamoDB implementation using single-table design pattern
- **React Frontend**: Modern UI with sign-in/sign-up components using shadcn/ui
- **Express Backend**: Simple and efficient authentication API
- **AWS CloudFormation**: Infrastructure as Code for DynamoDB table creation
- **TypeScript**: Full type safety across frontend and backend

## Architecture Overview

```
├── backend/                 # Express server with Better-Auth
│   ├── src/
│   │   ├── lib/
│   │   │   ├── auth.ts            # Better-Auth configuration
│   │   │   └── dynamoDBAdapter.ts # Custom DynamoDB adapter
│   │   └── server.ts               # Express server setup
│   └── dynamodb-cloudformation.json # AWS infrastructure template
│
└── frontend/                # React application
    ├── src/
    │   ├── components/      # UI components (SignIn, SignUp)
    │   └── lib/
    │       └── auth-client.ts # Better-Auth client configuration
    └── ...
```

## Prerequisites

- Node.js 18+ and pnpm
- AWS Account with DynamoDB access
- AWS CLI configured with appropriate credentials

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/renanwilliam/better-auth-dynamodb
cd better-auth-dynamodb
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend
pnpm install

# Install frontend dependencies
cd ../frontend
pnpm install
```

### 3. Set Up DynamoDB Table

The project includes AWS CloudFormation templates for easy DynamoDB setup:

```bash
cd backend

# Create the DynamoDB table
npm run db:setup

# Check table status
npm run db:info
```

This creates a DynamoDB table with:
- **Table Name**: `better-auth`
- **Billing Mode**: Pay-per-request (on-demand)
- **Partition Key**: PK (String)
- **Sort Key**: SK (String)
- **Global Secondary Index**: GSI1 for additional query patterns

### 4. Configure Environment Variables

Create a `.env` file in the backend directory:

```env
# backend/.env
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:8000
AWS_REGION=us-east-1
```

### 5. Start the Development Servers

```bash
# Terminal 1 - Start backend server
cd backend
npm run dev

# Terminal 2 - Start frontend server
cd frontend
npm run dev
```

- Backend: http://localhost:8000
- Frontend: http://localhost:5173

## DynamoDB Adapter Features

The custom DynamoDB adapter (`dynamoDBAdapter.ts`) provides:

### Core Operations
- **CRUD Operations**: Create, Read, Update, Delete for all auth entities
- **Batch Operations**: Efficient batch writes and deletes
- **Complex Queries**: Support for filtering, sorting, and pagination

### Single Table Design
```javascript
// Example usage in auth.ts
export const auth = betterAuth({
    database: dynamoDBAdapter({
        region: "us-east-1",
        useSingleTable: true,        // Enable single-table design
        tableName: "better-auth"      // Single table for all entities
    }),
    // ... other config
});
```

### Key Structure
- **Partition Key (PK)**: `{ENTITY_TYPE}#{id}` (e.g., `USER#123`)
- **Sort Key (SK)**: `{ENTITY_TYPE}#{id}` (enables entity isolation)
- **Type Field**: `_type` attribute for entity identification

### Advanced Features
- **Filter Expressions**: Support for complex WHERE clauses
- **Date Handling**: Automatic conversion between Date objects and ISO strings
- **Schema Generation**: Automatic CloudFormation template generation
- **Optimized Queries**: Uses GetItem for direct ID lookups, Scan with filters for complex queries

## API Endpoints

All authentication endpoints are available at `/api/auth/*`:

- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-in` - User login
- `POST /api/auth/sign-out` - User logout
- `GET /api/auth/session` - Get current session
- And more Better-Auth endpoints...

## Frontend Integration

The frontend uses Better-Auth's React client:

```typescript
// auth-client.ts
import { createAuthClient } from "better-auth/react";

export const client = createAuthClient({
    // Plugins for extended functionality
    plugins: [
        organizationClient(),
        twoFactorClient(),
        passkeyClient(),
        // ... more plugins
    ],
});

// Usage in components
export const { signUp, signIn, signOut, useSession } = client;
```

## Database Scripts

Manage your DynamoDB table with npm scripts:

```bash
# Create table
npm run db:create

# Wait for table creation
npm run db:wait

# Get table information
npm run db:info

# Update table configuration
npm run db:update

# Delete table (use with caution!)
npm run db:delete

# Complete setup (create + wait)
npm run db:setup
```

## Development

### Backend Development

```bash
cd backend
npm run dev    # Start with hot reload (tsx watch)
npm run build  # Build TypeScript
npm run start  # Start production server
```

### Frontend Development

```bash
cd frontend
npm run dev     # Start Vite dev server
npm run build   # Build for production
npm run preview # Preview production build
npm run lint    # Run ESLint
```

## Production Deployment

### DynamoDB Considerations

1. **Capacity Planning**: The table uses on-demand billing by default. For predictable workloads, consider provisioned capacity.

2. **Global Secondary Indexes**: The GSI1 index enables additional query patterns. Add more GSIs as needed for your use cases.

3. **Backup Strategy**: Enable point-in-time recovery and regular backups for production.

### Environment Variables

Ensure these are set in production:

- `BETTER_AUTH_SECRET`: Strong, unique secret key
- `BETTER_AUTH_URL`: Your production URL
- `AWS_REGION`: AWS region for DynamoDB
- AWS credentials (via IAM role, environment variables, or AWS SDK config)

### Security Best Practices

1. **IAM Permissions**: Use least-privilege IAM policies
2. **Encryption**: Enable encryption at rest for DynamoDB
3. **CORS**: Configure `trustedOrigins` in Better-Auth for your production domains
4. **Secrets Management**: Use AWS Secrets Manager or similar for sensitive data

## Customization

### Extending the DynamoDB Adapter

The adapter supports custom transformations:

```javascript
dynamoDBAdapter({
    // Custom input transformation
    customTransformInput: ({ data, fieldAttributes }) => {
        // Transform data before saving to DynamoDB
        return transformedData;
    },
    
    // Custom output transformation
    customTransformOutput: ({ data, fieldAttributes }) => {
        // Transform data after reading from DynamoDB
        return transformedData;
    }
});
```

### Multi-Table Design

If you prefer separate tables per entity:

```javascript
dynamoDBAdapter({
    useSingleTable: false,
    tablePrefix: "auth_"  // Creates auth_user, auth_session, etc.
});
```

## Troubleshooting

### Common Issues

1. **Table Not Found**: Ensure the DynamoDB table is created using `npm run db:setup`

2. **Authentication Errors**: Check that `BETTER_AUTH_SECRET` is set and consistent between frontend and backend

3. **CORS Issues**: Verify `trustedOrigins` includes your frontend URL

4. **AWS Credentials**: Ensure AWS CLI is configured or IAM role is attached

### Debug Mode

Enable detailed logging by setting:

```javascript
// In auth.ts
export const auth = betterAuth({
    // ... config
    verbose: true  // Enable debug logging
});
```

## Contributing

Contributions are welcome! Please ensure:

1. TypeScript types are properly defined
2. Code follows the existing style
3. DynamoDB operations are optimized
4. Tests are added for new features

## License

[Your License Here]

## Resources

- [Better-Auth Documentation](https://better-auth.com)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [React + Vite Documentation](https://vitejs.dev/guide/)

## Support

For issues and questions:
- Better-Auth specific: [Better-Auth GitHub](https://github.com/better-auth/better-auth)
- This implementation: [Create an issue](https://github.com/renanwilliam/better-auth-dynamodb/issues)