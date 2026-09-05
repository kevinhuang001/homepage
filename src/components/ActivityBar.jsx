import React from 'react';
import {
  ActivityAccount,
  ActivityFiles,
  ActivitySearch,
  ActivitySettings,
} from './icons.jsx';

const TOP = [
  { id: 'explorer', title: '资源管理器 (Ctrl+Shift+E)', Icon: ActivityFiles },
  { id: 'search', title: '搜索 (Ctrl+Shift+F)', Icon: ActivitySearch },
];

export default function ActivityBar({ activity, setActivity, sidebarOpen }) {
  const activate = (id) => {
    if (activity === id && sidebarOpen) {
      setActivity(id, false); // 再次点击：隐藏侧边栏（同 VS Code）
    } else {
      setActivity(id, true);
    }
  };

  return (
    <div className="activitybar">
      <div className="ab-top">
        {TOP.map(({ id, title, Icon }) => (
          <button
            key={id}
            title={title}
            className={`ab-btn ${activity === id && sidebarOpen ? 'active' : ''}`}
            onClick={() => activate(id)}
          >
            <Icon />
          </button>
        ))}
      </div>
      <div className="ab-bottom">
        <button className="ab-btn" title="管理（装饰）">
          <ActivitySettings />
        </button>
        <button className="ab-btn" title="个人资料（装饰）">
          <ActivityAccount />
        </button>
      </div>
    </div>
  );
}
