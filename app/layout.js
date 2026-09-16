import './globals.css';

export const metadata = {
  title: 'IE工时管理系统',
  description: '工艺工时管理与生产分析系统',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
