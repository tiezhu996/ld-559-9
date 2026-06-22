import { Button, Card, DatePicker, Drawer, Form, Input, Row, Space, Table, Typography, Select, Col } from 'antd';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { medicalApi } from '../api/medicalApi';
import { CostBarChart } from '../components/charts/CostBarChart';
import { PetAvatar } from '../components/common/PetAvatar';
import { VisitType, enumLabels } from '../constants/enums';
import { formatCurrency, formatDate } from '../utils/format';
import type { MedicalRecord, SearchMedicalParams } from '../types/medical';
import type { Dayjs } from 'dayjs';
import { useAuthStore } from '../stores/authStore';

const { RangePicker } = DatePicker;

export default function MedicalManagement() {
  const user = useAuthStore((s) => s.user);
  const [form] = Form.useForm();
  const [searchParams, setSearchParams] = useState<SearchMedicalParams>({});
  const [hasSearched, setHasSearched] = useState(false);
  const [selected, setSelected] = useState<MedicalRecord>();

  const { data = [], refetch, isFetching } = useQuery({
    queryKey: ['medical', searchParams, hasSearched],
    queryFn: () => (hasSearched ? medicalApi.search(searchParams) : medicalApi.list()),
  });

  const handleSearch = () => {
    const values = form.getFieldsValue();
    const range: [Dayjs, Dayjs] | undefined = values.visitRange;
    const params: SearchMedicalParams = {
      diagnosis: values.diagnosis?.trim() || undefined,
      prescription: values.prescription?.trim() || undefined,
      clinicId: values.clinicId || undefined,
      startDate: range?.[0]?.format('YYYY-MM-DD'),
      endDate: range?.[1]?.format('YYYY-MM-DD'),
    };
    setSearchParams(params);
    setHasSearched(true);
  };

  const handleReset = () => {
    form.resetFields();
    setSearchParams({});
    setHasSearched(false);
    refetch();
  };

  const columns = [
    { title: '宠物', render: (_value: unknown, record: MedicalRecord) => <Space><PetAvatar name={record.pet?.name || '宠'} species={record.pet!.species} size={32} />{record.pet?.name}</Space> },
    { title: '日期', dataIndex: 'visitDate', render: formatDate },
    { title: '类型', dataIndex: 'type', render: (value: VisitType) => enumLabels[value] },
    { title: '诊所', dataIndex: ['clinic', 'name'], render: (v: string) => v || '-' },
    { title: '诊断', dataIndex: 'diagnosis', ellipsis: true },
    { title: '处方', dataIndex: 'prescription', ellipsis: true },
    { title: '费用', dataIndex: 'cost', render: formatCurrency },
  ];

  if (user?.role === 'ADMIN' || user?.role === 'VET') {
    columns.splice(4, 0, { title: '医生', dataIndex: ['vet', 'name'], render: (v: string) => v || '-' });
  }

  return (
    <Space direction="vertical" size={20} className="page-block">
      <Typography.Title level={2}>就诊管理</Typography.Title>
      <Card title="全局检索">
        <Form form={form} layout="vertical" onFinish={handleSearch}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="diagnosis" label="病症">
                <Input placeholder="输入诊断关键词" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="prescription" label="药品">
                <Input placeholder="输入处方药品关键词" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="clinicId" label="诊所">
                <Select placeholder="选择诊所" allowClear showSearch optionFilterProp="label">
                  <Select.Option value="clinic-demo" label="萌宠中心医院">萌宠中心医院</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={16} lg={6}>
              <Form.Item name="visitRange" label="时间范围">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Space>
            <Button type="primary" htmlType="submit" loading={isFetching}>检索</Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Form>
      </Card>
      <Card>
        <Table
          rowKey="id"
          dataSource={data}
          loading={isFetching}
          onRow={(record) => ({ onClick: () => setSelected(record) })}
          columns={columns}
        />
      </Card>
      <Card title="费用统计">
        <CostBarChart records={data} />
      </Card>
      <Drawer title="处方详情" open={Boolean(selected)} onClose={() => setSelected(undefined)} width={420}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div>
            <Typography.Text type="secondary">宠物：</Typography.Text>
            <Typography.Text>{selected?.pet?.name}</Typography.Text>
          </div>
          <div>
            <Typography.Text type="secondary">就诊日期：</Typography.Text>
            <Typography.Text>{formatDate(selected?.visitDate)}</Typography.Text>
          </div>
          <div>
            <Typography.Text type="secondary">诊断：</Typography.Text>
            <Typography.Text>{selected?.diagnosis}</Typography.Text>
          </div>
          <div>
            <Typography.Text type="secondary">治疗方案：</Typography.Text>
            <Typography.Paragraph style={{ marginBottom: 0 }}>{selected?.treatment}</Typography.Paragraph>
          </div>
          <div>
            <Typography.Text type="secondary">处方：</Typography.Text>
            <Typography.Paragraph style={{ marginBottom: 0 }}>{selected?.prescription}</Typography.Paragraph>
          </div>
          <div>
            <Typography.Text type="secondary">费用：</Typography.Text>
            <Typography.Text strong>{selected?.cost != null ? formatCurrency(selected.cost) : '-'}</Typography.Text>
          </div>
        </Space>
      </Drawer>
    </Space>
  );
}
