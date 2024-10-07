/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: 'ddb-global-tables',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      home: 'aws',
      providers: {
        aws: {
          region: 'us-east-1',
        },
      },
    };
  },
  async run() {
    const table = new sst.aws.Dynamo('global-table', {
      fields: {
        id: 'string',
      },
      primaryIndex: { hashKey: 'id' },
      transform: {
        table: {
          streamEnabled: true,
          streamViewType: 'NEW_AND_OLD_IMAGES',
          replicas: [
            {
              regionName: aws.EUWest1Region,
            },
          ],
        },
      },
    });
    table.name.apply((tableName) => {
      const func = new sst.aws.Function('api', {
        handler: 'functions/lambda.handler',
        url: true,
        permissions: [
          {
            actions: ['dynamodb:*'],
            resources: [
              `arn:aws:dynamodb:${aws.EUWest1Region}:*:table/${tableName}`,
              `arn:aws:dynamodb:${aws.EUWest1Region}:*:table/${tableName}/*`,
            ],
          },
        ],
        link: [table],
      });

      new sst.aws.Astro('ddb-gt', {
        environment: {
          API_URL: func.url,
        },
      });
    });
  },
});
