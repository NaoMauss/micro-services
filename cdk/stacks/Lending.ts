import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "node:process";

import type { StackProps } from "aws-cdk-lib";
import { Duration, Stack } from "aws-cdk-lib";
import type { Construct } from "constructs";

import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import type * as ec2 from "aws-cdk-lib/aws-ec2";

interface LendingStackProps extends StackProps {
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

export class LendingStack extends Stack {
  constructor(scope: Construct, id: string, props: LendingStackProps) {
    super(scope, id, props);

    const dir = dirname(fileURLToPath(import.meta.url));

    const authLambda = new nodejs.NodejsFunction(this, "Auth", {
      entry: join(dir, "../../src/lendings/auth.ts"),
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
      memorySize: 128,
      bundling: commonBundlingConfig,
      environment: {
        DATABASE_URL: env.DATABASE_URL!,
        SES_EMAIL_SOURCE: env.SES_EMAIL_SOURCE!,
        JWT_SECRET: env.JWT_SECRET!,
      },
    });

    // Create Lambda functions
    const sendMailLambda = new nodejs.NodejsFunction(this, "SendMail", {
      entry: join(dir, "../../src/lendings/sendMail.ts"),
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
      bundling: commonBundlingConfig,
      memorySize: 128,
      environment: {
        DATABASE_URL: env.DATABASE_URL!,
        SES_EMAIL_SOURCE: env.SES_EMAIL_SOURCE!,
      },
    });

    const giveBackBookLambda = new nodejs.NodejsFunction(this, "GiveBackBook", {
      entry: join(dir, "../../src/lendings/giveBackBook.ts"),
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
      bundling: commonBundlingConfig,
      memorySize: 128,
      environment: {
        DATABASE_URL: env.DATABASE_URL!,
      },
    });

    const lendBookRole = new iam.Role(this, "LendBookRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    const lendBookLambda = new nodejs.NodejsFunction(this, "LendBook", {
      entry: join(dir, "../../src/lendings/lendBook.ts"),
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
      bundling: commonBundlingConfig,
      memorySize: 128,
      role: lendBookRole,
      environment: {
        DATABASE_URL: env.DATABASE_URL!,
        JWT_SECRET: env.JWT_SECRET!,
        targetLambdaArn: sendMailLambda.functionArn,
        schedulerExecutionRoleArn: lendBookRole.roleArn,
      },
    });

    // Create Scheduler execution role
    const schedulerRole = new iam.Role(this, "SchedulerRole", {
      assumedBy: new iam.ServicePrincipal("scheduler.amazonaws.com"),
    });

    // Grant Scheduler role permission to invoke SendMail lambda
    sendMailLambda.grantInvoke(schedulerRole);

    // Grant LendBook lambda permission to create schedules
    lendBookLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: [ "scheduler:CreateSchedule" ],
      resources: [ "*" ],
    }));

    // Grant GiveBackBook lambda permission to delete schedules
    giveBackBookLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: [ "scheduler:DeleteSchedule" ],
      resources: [ "*" ],
    }));

    // Grant SendMail lambda permission to send emails via SES
    sendMailLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: [ "ses:SendEmail", "ses:SendRawEmail" ],
      resources: [ "*" ], // Consider restricting to specific SES ARN
    }));

    // Create API Gateway
    const api = new apigw.RestApi(this, "LendingApi", {
      description: "Lending API",
      defaultMethodOptions: {
        apiKeyRequired: true,
      },
      endpointTypes: [ apigw.EndpointType.REGIONAL ],
    });

    // Add usage plan
    const plan = api.addUsagePlan("UsagePlanLending", {
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

    const apiKey = api.addApiKey("Lending");

    plan.addApiKey(apiKey);

    // Add routes
    api.root.addResource("lend").addMethod("POST", new apigw.LambdaIntegration(lendBookLambda));
    api.root.addResource("return").addMethod("POST", new apigw.LambdaIntegration(giveBackBookLambda));
    api.root.addResource("auth").addMethod("POST", new apigw.LambdaIntegration(authLambda));
  }
}
