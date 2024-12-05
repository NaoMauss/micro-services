import type { StackProps } from "aws-cdk-lib";
import { Stack } from "aws-cdk-lib";

import type { Construct } from "constructs";

import * as ec2 from "aws-cdk-lib/aws-ec2";

export class VpcStack extends Stack {
  vpc: ec2.Vpc;

  securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, "BainVPC", {
      maxAzs: 2,
      natGateways: 0,
    });

    // Security Group
    this.securityGroup = new ec2.SecurityGroup(this, "MicroServicesSg", {
      vpc: this.vpc,
    });

    this.securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));
    this.securityGroup.addIngressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(80));
    this.securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443));
    this.securityGroup.addIngressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(443));
  }
}
