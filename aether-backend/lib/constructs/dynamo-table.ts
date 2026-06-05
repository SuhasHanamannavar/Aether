import { RemovalPolicy } from 'aws-cdk-lib';
import {
  Attribute,
  AttributeType,
  BillingMode,
  ProjectionType,
  Table,
  TableProps,
} from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface DynamoTableProps {
  tableName: string;
  partitionKey: Attribute;
  sortKey?: Attribute;
  globalSecondaryIndexes?: Array<{
    indexName: string;
    partitionKey: Attribute;
    sortKey?: Attribute;
    projectionType?: ProjectionType;
  }>;
}

export class DynamoTable extends Construct {
  public readonly table: Table;

  constructor(scope: Construct, id: string, props: DynamoTableProps) {
    super(scope, id);

    const tableProps: TableProps = {
      tableName: props.tableName,
      partitionKey: props.partitionKey,
      sortKey: props.sortKey,
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: false,
    };

    this.table = new Table(this, 'Table', tableProps);

    if (props.globalSecondaryIndexes) {
      for (const gsi of props.globalSecondaryIndexes) {
        this.table.addGlobalSecondaryIndex({
          indexName: gsi.indexName,
          partitionKey: gsi.partitionKey,
          sortKey: gsi.sortKey,
          projectionType: gsi.projectionType ?? ProjectionType.ALL,
        });
      }
    }
  }
}
