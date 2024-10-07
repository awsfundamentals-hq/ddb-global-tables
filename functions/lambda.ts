import {
  DynamoDBClient,
  ScanCommand,
  PutItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { Resource } from 'sst';
import { v4 as uuidv4 } from 'uuid';

const tableName = Resource['global-table'].name;
const ddbUsEast1 = new DynamoDBClient({ region: 'us-east-1' });
const ddbEuWest1 = new DynamoDBClient({ region: 'eu-west-1' });

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  if (event.requestContext.http.method === 'GET') {
    const params = {
      TableName: tableName,
      FilterExpression: 'attribute_exists(id)',
    };

    const scanUsEast1 = new ScanCommand(params);
    const scanEuWest1 = new ScanCommand(params);

    const [usEast1Result, euWest1Result] = await Promise.all([
      ddbUsEast1.send(scanUsEast1),
      ddbEuWest1.send(scanEuWest1),
    ]);

    const transformItems = (items: any[]): { id: string }[] => {
      return items.map((item) => ({
        id: item.id.S,
      }));
    };

    return {
      statusCode: 200,
      body: JSON.stringify({
        usEast1Items: transformItems(usEast1Result.Items || []),
        euWest1Items: transformItems(euWest1Result.Items || []),
      }),
    };
  } else if (event.requestContext.http.method === 'POST') {
    const body = JSON.parse(event.body || '{}');
    const region = body.region;

    if (region !== 'us-east-1' && region !== 'eu-west-1') {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid region. Must be us-east-1 or eu-west-1.',
        }),
      };
    }

    const newItem = {
      id: { S: uuidv4() },
    };

    const putParams = {
      TableName: tableName,
      Item: newItem,
    };

    const putCommand = new PutItemCommand(putParams);
    const ddbClient = region === 'us-east-1' ? ddbUsEast1 : ddbEuWest1;

    await ddbClient.send(putCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Item added successfully',
        id: newItem.id.S,
      }),
    };
  } else if (event.requestContext.http.method === 'DELETE') {
    const scanParams = {
      TableName: tableName,
      FilterExpression: 'attribute_exists(id)',
    };

    const scanCommand = new ScanCommand(scanParams);
    const scanResult = await ddbUsEast1.send(scanCommand);

    if (scanResult.Items && scanResult.Items.length > 0) {
      const deletePromises = scanResult.Items.map((item) => {
        const deleteParams = {
          TableName: tableName,
          Key: { id: item.id },
        };
        const deleteCommand = new DeleteItemCommand(deleteParams);
        return ddbUsEast1.send(deleteCommand);
      });

      await Promise.all(deletePromises);

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: `Successfully deleted ${scanResult.Items.length} items from us-east-1 region`,
        }),
      };
    } else {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No items to delete in us-east-1 region',
        }),
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
};
