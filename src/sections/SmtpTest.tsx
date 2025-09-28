import React, { useState } from 'react';
import { Button, Card, Typography, Spin, Alert } from 'antd';

const SmtpTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      setError('Admin token not found. Please set it in your browser local storage.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/smtp-verify', {
        headers: {
          'x-admin-token': adminToken,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'An unknown error occurred.');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="SMTP Connection Test">
      <Typography.Paragraph>
        Click the button below to verify the SMTP server connection. This will use the credentials configured on the server.
      </Typography.Paragraph>
      <Button type="primary" onClick={handleTest} disabled={loading}>
        {loading ? <Spin /> : 'Run SMTP Test'}
      </Button>
      {result && (
        <Alert
          message="SMTP Connection Successful"
          description={
            <pre style={{ margin: 0 }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          }
          type="success"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
      {error && (
        <Alert
          message="SMTP Connection Failed"
          description={error}
          type="error"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </Card>
  );
};

export default SmtpTest;