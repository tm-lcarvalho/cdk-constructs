import * as cdk from 'aws-cdk-lib';
import { Construct } from "constructs";
import { TmVpcbaseStack } from './tm-vpc-base-stack';
import { BastionStack } from './tm-bastion-stack';
import { TmEcsStack, TmEcsStackProps } from './tm-ecs-stack';
import { TmCloudfrontStack, TmCloudfrontStackProps } from './tm-cloudfront-stack';

export class TmPipelineAppStage extends cdk.Stage {

    constructor(scope: Construct, id: string, props?: cdk.StageProps) {
      super(scope, id, props);

      const usEast1Env = {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-east-1',
      }
      
      const caCentral1Env = {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'ca-central-1',
      }
      const caWest1Env = {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        //region: 'ca-west-1',
        region: 'us-west-1',
      }

      const vpcCaCentralStack = new TmVpcbaseStack(this, 'vpcCaCentral2Stack', {
        env: caCentral1Env,
        range: '10.3.0.0/16',
      });

      const vpcCaWestStack = new TmVpcbaseStack(this, 'vpcCaWest2Stack', {
        env: caWest1Env,
        range: '10.4.0.0/16',
      });

      new BastionStack(this, 'BastionCaWestStack', {
        vpc: vpcCaWestStack.vpc,
        env: caWest1Env,
      });
      
      new BastionStack(this, 'BastionCaCentralStack', {
        vpc: vpcCaCentralStack.vpc,
        env: caCentral1Env,
      });
    
      const ecsCaCentral1StackProps: TmEcsStackProps = {
        crossRegionReferences: true,
        // allowPublicInternetAccess: true,
        // listenToHttp: true,
        // listenToHttps: false,
        // memoryLimitMiB: 512,
        // cpu: 256,
        // desiredCount: 1,
        // minTaskCount: 1,
        // maxTaskCount: 3,
        // containerPort: 80,
        env: caCentral1Env,
        vpc: vpcCaCentralStack.vpc,
        domainName: 'www.pguv3-accept.quebec.ca',
        hostedZoneId: 'Z09506881MQ4TUQ1SCU3U',
      }

      /*
      const ecsCaWest1StackProps: TmEcsStackProps = {
        crossRegionReferences: true,
        // allowPublicInternetAccess: true,
        // listenToHttp: true,
        // listenToHttps: false,
        // memoryLimitMiB: 512,
        // cpu: 256,
        // desiredCount: 1,
        // minTaskCount: 1,
        // maxTaskCount: 3,
        // containerPort: 80,
        env: caWest1Env,
        vpc: vpcCaWestStack.vpc,
        domainName: 'www.pguv3-accept.quebec.ca',
        hostedZoneId: 'Z09506881MQ4TUQ1SCU3U',
      } */
      const ecsCaCentral1Stack = new TmEcsStack(this, 'EcsCaCentral1Stack', ecsCaCentral1StackProps);

      //const ecsCaWest1Stack = new TmEcsStack(this, 'EcsCaWest1Stack', ecsCaWest1StackProps);

      const cloudFrontStackProps: TmCloudfrontStackProps = {
        crossRegionReferences: true,
        originDnsName: ecsCaCentral1Stack.loadbalancer.loadBalancerDnsName,
        domainName: ecsCaCentral1StackProps.domainName,
        hostedZoneId: ecsCaCentral1StackProps.hostedZoneId,
        env: usEast1Env,
        // additionalCookies: [],
        // retainLogBuckets: false,
        // webAclId: '',
        // errorCachingMinTtl: 300,
        applicationLoadbalancer: ecsCaCentral1Stack.loadbalancer,
      }
      new TmCloudfrontStack(this, 'CustomCloudfrontStack', cloudFrontStackProps);
    }

}
