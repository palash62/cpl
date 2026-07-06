"use client";

import { CheckCircle, Server } from "lucide-react";
import { PageSection } from "@/components/admin/page-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailModuleShell } from "../email-module-shell";

const PROVIDERS = [
  { id: "ses", name: "Amazon SES", status: "connected" as const },
  { id: "sendgrid", name: "SendGrid", status: "available" as const },
  { id: "mailgun", name: "Mailgun", status: "available" as const },
  { id: "custom", name: "Custom SMTP", status: "available" as const },
];

export function SmtpPanel() {
  return (
    <EmailModuleShell
      title="SMTP"
      description="Configure email delivery providers and test your connection."
      breadcrumbs={[
        { label: "Autoresponder", href: "/advertiser/email" },
        { label: "SMTP" },
      ]}
      showToolbar={false}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {PROVIDERS.map((provider) => (
          <Card
            key={provider.id}
            className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{provider.name}</CardTitle>
                <Badge variant={provider.status === "connected" ? "default" : "outline"}>
                  {provider.status}
                </Badge>
              </div>
              <CardDescription>
                {provider.status === "connected"
                  ? "Currently active for sending"
                  : "Click to configure"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" variant="outline" size="sm" className="w-full">
                {provider.status === "connected" ? "Manage" : "Connect"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <PageSection title="SMTP Configuration" icon={Server} gradient="leads">
        <div className="grid gap-4 px-6 pb-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="smtp-host">SMTP Host</Label>
            <Input id="smtp-host" placeholder="smtp.example.com" defaultValue="email-smtp.ap-south-1.amazonaws.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp-port">Port</Label>
            <Input id="smtp-port" placeholder="587" defaultValue="587" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp-user">Username</Label>
            <Input id="smtp-user" placeholder="SMTP username" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp-pass">Password</Label>
            <Input id="smtp-pass" type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="smtp-from">From Address</Label>
            <Input id="smtp-from" placeholder="noreply@leadvix.io" defaultValue="noreply@leadvix.io" />
          </div>
        </div>
        <div className="border-t border-slate-100 px-6 py-4">
          <Button type="button">
            <CheckCircle className="mr-2 h-4 w-4" />
            Test Connection
          </Button>
        </div>
      </PageSection>
    </EmailModuleShell>
  );
}
