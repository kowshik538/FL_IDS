import React from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function Threats() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <TopBar />
      <div className="container mx-auto p-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Threat Intelligence</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300">
              Threat overview page placeholder. You can extend this with real threat data later.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

