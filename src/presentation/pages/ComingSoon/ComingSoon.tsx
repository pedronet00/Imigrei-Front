import type { ReactNode } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { EmptyState } from '../../components/ui/EmptyState';

interface ComingSoonProps {
  title: string;
  description: string;
  icon: ReactNode;
}

export function ComingSoon({ title, description, icon }: ComingSoonProps) {
  return (
    <PageContainer title={title}>
      <EmptyState icon={icon} title="Em desenvolvimento" description={description} />
    </PageContainer>
  );
}
