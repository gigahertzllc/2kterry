import { useState } from 'react';
import { Package, Users, ShoppingCart, Settings as SettingsIcon, MessageSquare } from 'lucide-react';
import { Game, SkinPack } from '../types';
import { SkinPacksTab } from './dashboard/SkinPacksTab';
import { CustomersTab } from './dashboard/CustomersTab';
import { OrdersTab } from './dashboard/OrdersTab';
import { SettingsTab } from './dashboard/SettingsTab';
import { TestimonialsTab } from './dashboard/TestimonialsTab';

interface DashboardPageProps {
  games: Game[];
  skinPacks: SkinPack[];
  onAddSkinPack: (skinPack: Omit<SkinPack, 'id'>) => void;
  onUpdateSkinPack: (id: string, skinPack: Omit<SkinPack, 'id'>) => void;
  onDeleteSkinPack: (id: string) => void;
}

type TabType = 'skinpacks' | 'customers' | 'orders' | 'testimonials' | 'settings';

export function DashboardPage({ games, skinPacks, onAddSkinPack, onUpdateSkinPack, onDeleteSkinPack }: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('skinpacks');

  const tabs = [
    { id: 'skinpacks' as TabType, label: 'Skin Packs', icon: Package },
    { id: 'customers' as TabType, label: 'Customers', icon: Users },
    { id: 'orders' as TabType, label: 'Orders', icon: ShoppingCart },
    { id: 'testimonials' as TabType, label: 'Testimonials', icon: MessageSquare },
    { id: 'settings' as TabType, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen pt-20 bg-slate-950">
      {/* Dashboard Header */}
      <div className="bg-gradient-to-br from-orange-500/20 to-orange-500/20 border-b border-orange-500/20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="mb-4">Admin Dashboard</h1>
          <p className="text-gray-400">Manage your store, customers, and orders</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 flex items-center gap-3 border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-white bg-slate-900'
                      : 'border-transparent text-gray-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {activeTab === 'skinpacks' && (
          <SkinPacksTab
            games={games}
            skinPacks={skinPacks}
            onAddSkinPack={onAddSkinPack}
            onUpdateSkinPack={onUpdateSkinPack}
            onDeleteSkinPack={onDeleteSkinPack}
          />
        )}
        
        {activeTab === 'customers' && <CustomersTab />}
        
        {activeTab === 'orders' && <OrdersTab skinPacks={skinPacks} />}

        {activeTab === 'testimonials' && <TestimonialsTab />}

        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}
