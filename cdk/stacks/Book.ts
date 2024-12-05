import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "node:process";

import type { StackProps } from "aws-cdk-lib";
import { Duration, Stack } from "aws-cdk-lib";
import type { Construct } from "constructs";

import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import type * as ec2 from "aws-cdk-lib/aws-ec2";

interface BookStackProps extends StackProps {
  readonly vpc?: ec2.IVpc;
}

const commonBundlingConfig = {
  minify: true,
  sourceMap: true,
  externalModules: [
    "@aws-sdk/*",
    "bcrypt",
    "pg-native",
  ],
};

export class BookStack extends Stack {
  constructor(scope: Construct, id: string, props: BookStackProps) {
    super(scope, id, props);

    const dir = dirname(fileURLToPath(import.meta.url));

    const addBook = new nodejs.NodejsFunction(this, "AddBook", {
      entry: join(dir, "../../src/library/lambdas/addBook.ts"),
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
      bundling: commonBundlingConfig,
      memorySize: 128,
      environment: {
        DATABASE_URL: env.DATABASE_URL!,
      },
    });

    const deleteBook = new nodejs.NodejsFunction(this, "DeleteBook", {
      entry: join(dir, "../../src/library/lambdas/deleteBook.ts"),
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
      bundling: commonBundlingConfig,
      memorySize: 128,
      environment: {
        DATABASE_URL: env.DATABASE_URL!,
      },
    });

    const getAllBooks = new nodejs.NodejsFunction(this, "GetAllBooks", {
      entry: join(dir, "../../src/library/lambdas/getAllBooks.ts"),
      runtime: lambda.Runtime.NODEJS_22_X,
      bundling: commonBundlingConfig,
      timeout: Duration.seconds(30),
      memorySize: 128,
      environment: {
        DATABASE_URL: env.DATABASE_URL!,
      },
    });

    const api = new apigw.RestApi(this, "ApiGwBook", {
      description: "Library API",
      defaultMethodOptions: {
        apiKeyRequired: true,
      },
      endpointTypes: [ apigw.EndpointType.REGIONAL ],
    });

    const plan = api.addUsagePlan("UsagePlanBook", {
      throttle: {
        rateLimit: 100,
        burstLimit: 100,
      },
      quota: {
        limit: 50000,
        period: apigw.Period.MONTH,
      },
    });

    plan.addApiStage({
      stage: api.deploymentStage,
    });

    const apiKey = api.addApiKey("BookApiKey");

    plan.addApiKey(apiKey);

    const book = api.root.addResource("book");

    book.addMethod("GET", new apigw.LambdaIntegration(getAllBooks));
    book.addMethod("POST", new apigw.LambdaIntegration(addBook));
    book.addMethod("DELETE", new apigw.LambdaIntegration(deleteBook));
  }
}
