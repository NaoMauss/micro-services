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

interface UserStackProps extends StackProps {
  readonly vpc?: ec2.IVpc;
}

const commonBundlingConfig = {
  minify: true,
  sourceMap: true,
  externalModules: [
    "@aws-sdk/*",
    "bcrypt",
  ],
};

export class UserStack extends Stack {
  constructor(scope: Construct, id: string, props: UserStackProps) {
    super(scope, id, props);

    const dir = dirname(fileURLToPath(import.meta.url));

    const addUser = new nodejs.NodejsFunction(this, "AddUser", {
      entry: join(dir, "../../src/userPool/addUser.ts"),
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
      memorySize: 128,
      bundling: commonBundlingConfig,
      environment: {
        DATABASE_URL: env.DATABASE_URL!,
        JWT_SECRET: env.JWT_SECRET!,
      },
    });

    const deleteUser = new nodejs.NodejsFunction(this, "DeleteUser", {
      entry: join(dir, "../../src/userPool/deleteUser.ts"),
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
      memorySize: 128,
      bundling: commonBundlingConfig,
      environment: {
        DATABASE_URL: env.DATABASE_URL!,
        JWT_SECRET: env.JWT_SECRET!,
      },
    });

    const updateUser = new nodejs.NodejsFunction(this, "UpdateUser", {
      entry: join(dir, "../../src/userPool/updateUser.ts"),
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
      memorySize: 128,
      bundling: commonBundlingConfig,
      environment: {
        DATABASE_URL: env.DATABASE_URL!,
        JWT_SECRET: env.JWT_SECRET!,
      },
    });

    const getUser = new nodejs.NodejsFunction(this, "GetUser", {
      entry: join(dir, "../../src/userPool/getUser.ts"),
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
      memorySize: 128,
      bundling: commonBundlingConfig,
      environment: {
        DATABASE_URL: env.DATABASE_URL!,
        JWT_SECRET: env.JWT_SECRET!,
      },
    });

    const api = new apigw.RestApi(this, "ApiGwUser", {
      description: "ML Utils API",
      defaultMethodOptions: {
        apiKeyRequired: true,
      },
      endpointTypes: [ apigw.EndpointType.REGIONAL ],
    });

    const plan = api.addUsagePlan("UsagePlanUser", {
      quota: {
        limit: 50000,
        period: apigw.Period.MONTH,
      },
      throttle: {
        burstLimit: 100,
        rateLimit: 100,
      },
    });

    plan.addApiStage({
      stage: api.deploymentStage,
    });

    const apiKey = api.addApiKey("UserApiKey");

    plan.addApiKey(apiKey);

    const user = api.root.addResource("user");

    user.addMethod("POST", new apigw.LambdaIntegration(addUser));
    user.addMethod("DELETE", new apigw.LambdaIntegration(deleteUser));
    user.addMethod("PUT", new apigw.LambdaIntegration(updateUser));
    user.addMethod("GET", new apigw.LambdaIntegration(getUser));
  }
}
