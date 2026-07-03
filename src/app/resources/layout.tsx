import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resurser & partnerportal – Hatake Social',
  description: 'Access marketing materials, B2B pricing, and API data for Hatake Network.',
};

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
