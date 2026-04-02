import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, Settings, Database, Lock } from 'lucide-react';

import { SecurityHeadersEnforcer } from './SecurityHeadersEnforcer';
import { EnhancedSecurityHeaders } from './EnhancedSecurityHeaders';
import { SecurityAlertSystem } from './SecurityAlertSystem';
import { EnhancedSecurityScanResults } from './EnhancedSecurityScanResults';
import { SecurityConfigurationManager } from './SecurityConfigurationManager';
import { SecurityMonitoringDashboard } from './SecurityMonitoringDashboard';
import { SecurityMigrationManager } from './SecurityMigrationManager';
import { SecurityAgentMonitor } from './SecurityAgentMonitor';

export function EnhancedSecurityDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-background">
      <SecurityHeadersEnforcer />
      <EnhancedSecurityHeaders />
      <SecurityAlertSystem />
      
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              Security Control Center
            </h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive security monitoring and configuration management
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
            Enhanced Protection Active
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="configuration" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="data-security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Data Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Security Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>RLS Policies</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Data Encryption</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Audit Logging</span>
                      <Badge variant="default">Enhanced</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Input Sanitization</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Client Security Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Security Headers</span>
                      <Badge variant="default">Enforced</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Data Encryption</span>
                      <Badge variant="default">AES-256</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>XSS Protection</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>CSRF Protection</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <EnhancedSecurityScanResults />
          </TabsContent>

          <TabsContent value="configuration" className="space-y-6">
            <SecurityConfigurationManager />
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <SecurityMonitoringDashboard />
            <SecurityAgentMonitor />
          </TabsContent>

          <TabsContent value="data-security" className="space-y-6">
            <SecurityMigrationManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}