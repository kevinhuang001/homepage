import React from 'react';
import { AccountInitials, Bell, Branch, Check, ErrorDot, Sync, WarnDot } from './icons.jsx';
import { PROFILE } from '../data/vfs.js';

export default function StatusBar({ activeNode }) {
  return (
    <div className="statusbar">
      <div className="sb-left">
        <span className="sb-item" title="分支（装饰）">
          <Branch /> <span className="sb-label">{PROFILE.branch}</span>
        </span>
        <span className="sb-item" title="同步更改（装饰）">
          <Sync />
        </span>
        <span className="sb-item" title="错误 0 · 警告 0">
          <ErrorDot /> 0
        </span>
        <span className="sb-item" title="错误 0 · 警告 0">
          <WarnDot /> 0
        </span>
        <span className="sb-item remote" title="远程源（装饰）">
          ⇅
        </span>
      </div>
      <div className="sb-right">
        <span className="sb-item" title="行号与列号（装饰）">
          Ln 1, Col 1
        </span>
        <span className="sb-item" title="空格：2（装饰）">
          空格: 2
        </span>
        <span className="sb-item" title="编码（装饰）">
          UTF-8
        </span>
        <span className="sb-item" title="换行符（装饰）">
          LF
        </span>
        <span className="sb-item lang" title="当前文件语言">
          {activeNode?.language || '纯文本'}
        </span>
        <span className="sb-item" title="通知（装饰）">
          <Bell />
        </span>
        <span className="sb-item" title={`${PROFILE.name}（示例用户）`}>
          <AccountInitials text={PROFILE.initials} size={18} />
        </span>
      </div>
    </div>
  );
}
