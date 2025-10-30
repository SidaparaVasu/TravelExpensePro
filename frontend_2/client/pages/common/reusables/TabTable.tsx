import React from 'react';
import { Tabs, Table, Button } from 'antd';

interface TabTableProps {
  tabs: {
    key: string;
    label: string;
    columns: any[];
    dataSource: any[];
    onEdit?: (record: any) => void;
    onDelete?: (record: any) => void;
  }[];
}

const TabTable: React.FC<TabTableProps> = ({ tabs }) => {
  // Generate items for AntD Tabs
  const items = tabs.map((tab) => ({
    key: tab.key,
    label: tab.label,
    children: (
      <Table
        columns={[
          ...tab.columns,
          {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
              <div className="flex gap-2">
                {tab.onEdit && <Button onClick={() => tab.onEdit!(record)}>Edit</Button>}
                {tab.onDelete && <Button danger onClick={() => tab.onDelete!(record)}>Delete</Button>}
              </div>
            ),
          },
        ]}
        dataSource={tab.dataSource || []} // prevent undefined error
        rowKey={(record) => record.id || record.key}
        pagination={{ pageSize: 10 }}
      />
    ),
  }));

  return <Tabs items={items} />;
};

export default TabTable;
