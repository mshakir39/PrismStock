import React, { useState } from 'react';

interface Tab {
  id: number;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  onTabClick: (id: number, label: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, onTabClick }) => {
  const [activeTab, setActiveTab] = useState<number>(tabs[0]?.id);

  const handleTabClick = (id: number, label: string) => {
    setActiveTab(id);
    onTabClick(id, label); // Pass the active tab's information to the parent component
  };

  return (
    <div className='tabs'>
      <div className='tab-header'>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id, tab.label)}
          >
            {tab.label}
          </div>
        ))}
      </div>
      <div className='tab-content'>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab-pane ${activeTab === tab.id ? 'active' : 'inactive'}`}
          >
            {activeTab === tab.id && tab.content}{' '}
            {/* Render content only if tab is active */}
          </div>
        ))}
      </div>
      <style jsx>{`
        .tabs {
          display: flex;
          flex-direction: column;
          width: 100%;
        }
        .tab-header {
          display: flex;
          border-bottom: 1px solid #ccc;
        }
        .tab-item {
          padding: 10px 20px;
          cursor: pointer;
          border-bottom: 1px solid transparent;
        }
        .tab-item:hover {
          background-color: #f0f0f0;
        }
        .tab-item.active {
          border-bottom-color: #193043;
          color: #193043;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default Tabs;
