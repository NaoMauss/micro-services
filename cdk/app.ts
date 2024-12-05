import { env } from "node:process";
import { App } from "aws-cdk-lib";
import { VpcStack } from "./stacks/Vpc.js";
import { BookStack } from "./stacks/Book.js";
import { UserStack } from "./stacks/User.js";
import { LendingStack } from "./stacks/Lending.js";

const awsEnv = {
  account: env.CDK_DEFAULT_ACCOUNT!,
  region: env.CDK_DEFAULT_REGION!,
};
const app = new App();

new BookStack(app, "BookStack", {
  env: awsEnv,
});

new UserStack(app, "UserStack", {
  env: awsEnv,
});

new LendingStack(app, "LendingStack", {
  env: awsEnv,
});
