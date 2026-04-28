import React from 'react';

export default function StatCard({ title, value, icon: Icon, iconColor }) {
  return (
    <div className="bg-card p-5 rounded-2xl shadow-sm border border-border flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="p-3.5 bg-secondary rounded-xl">
        <Icon size={22} className={iconColor || 'text-primary'} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}